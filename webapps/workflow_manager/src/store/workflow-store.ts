import createClient from "openapi-fetch";
import type { paths, components } from "workflow_manager_api";
import { z } from "zod";
import { DayjsSchema, standardUndefined, Assert, Extends, IntegerSchema, DecimalSchema, } from "common_schemas";
import dayjs, { Dayjs } from "dayjs";
import "decimal.js";
import { makeObservable, observable, action } from "mobx";

const client = createClient<paths>({ baseUrl: import.meta.env.VITE_WORKFLOW_MANAGER_BASE_URL });

const EPOCH = dayjs(0);

/**
 * All in one store. It guarantees the application state is in sync with the servers.
 *
 * DISCLAIMER: big file! Consolidating the store logic here helps minimize the exposure
 * of types that are only relevant internally to the store. Breaking it into smaller
 * files for chunking doesn’t offer much benefit, as nearly all store code is needed 
 * all the time for this app.
 */
export class WorkflowStore {
    private workflows: Map<number, Workflow> = new Map();
    private workflowStates: Map<number, WorkflowState> = new Map();
    private workflowEntities: Map<number, WorkflowEntity> = new Map();
    private workflowAttributes: Map<number, WorkflowAttribute> = new Map();
    private stateAttributes: Map<number, WorkflowAttribute> = new Map();
    private entityAttributes: Map<number, WorkflowAttribute> = new Map();

    private patch = <T extends { updateTime?: Dayjs }>({ maybeNew, cur }: { maybeNew: T, cur: T }) => {
        if ((cur.updateTime ?? EPOCH).isBefore((maybeNew.updateTime ?? EPOCH))) {
            for (const key of (Object.keys(cur) as (keyof T)[])) {
                cur[key] = maybeNew[key];
            }
        }
    }

    private massInsert = <T extends { updateTime?: Dayjs; id: number }>(list: T[], map: Map<number, T>) => {
        for (const el of list) {
            const cur = map.get(el.id);

            if (!cur) map.set(el.id, el)
            else this.patch({ maybeNew: el, cur });
        }
    }

    public constructor() {
        makeObservable<WorkflowStore, "workflows" | "workflowStates" | "workflowEntities" | "workflowAttributes" | "stateAttributes" | "entityAttributes" | "patch" | "massInsert">(this, {
            workflows: observable,
            workflowStates: observable,
            workflowEntities: observable,
            workflowAttributes: observable,
            stateAttributes: observable,
            entityAttributes: observable,
            patch: action,
            massInsert: action,
        });
    }
}

export type Workflow = z.infer<typeof parsers.WorkflowSchema>;
export type WorkflowState = z.infer<typeof parsers.WorkflowStateSchema>;
export type WorkflowEntity = z.infer<typeof parsers.WorkflowEntitySchema>;
export type WorkflowAttribute = z.infer<typeof parsers.WorkflowAttributeWithDescriptionSchema>;

module parsers {
    const ENTITY_MAX_NAME_LENGTH = 50;

    const EntitySchema = z.object({
        id: z.number(),
        name: z.string().max(ENTITY_MAX_NAME_LENGTH),
        userId: z.number(),
        clientId: z.number(),
        creationTime: DayjsSchema,
        updateTime: DayjsSchema,
        deletionTime: DayjsSchema.nullish().transform(standardUndefined),
    });

    export const WORKFLOW_ATTRIBUTE_REFERENCE_TYPES = ["WORKFLOW", "WORKFLOW_STATE", "WORKFLOW_ENTITY"] as const;
    export type WorkflowAttributeReferenceType = typeof WORKFLOW_ATTRIBUTE_REFERENCE_TYPES[number];
    export const WORKFLOW_ATTRIBUTE_TYPES = ["INTEGER", "FLOATING", "ENUMERATION", "DECIMAL", "DATE", "TIMESTAMP", "FLAG", "TEXT"] as const;
    export type WorkflowAttributeType = typeof WORKFLOW_ATTRIBUTE_TYPES[number];

    export const WorkflowAttributeRuleSchema = z.object({
        rule: z.string().nullish().transform(standardUndefined),
        description: z.string().nullish().transform(standardUndefined),
        errorText: z.string().nullish().transform(standardUndefined),
    });

    export const WorkflowAttributeExprRuleSchema = WorkflowAttributeRuleSchema;
    export const WorkflowAttributeRegexRuleSchema = WorkflowAttributeRuleSchema;

    export const WorkflowAttributeDescriptionSchema =
        z.object({
            parentWorkflowId: z.number(),
            refType: z.enum(WORKFLOW_ATTRIBUTE_REFERENCE_TYPES),
            attrType: z.enum(WORKFLOW_ATTRIBUTE_TYPES),
            expression: WorkflowAttributeExprRuleSchema.nullish().transform(standardUndefined),
            regex: WorkflowAttributeRegexRuleSchema.nullish().transform(standardUndefined),
            maxLength: z.number().nullish().transform(standardUndefined),
            enumDescription: z.string().array().nullish().transform(standardUndefined),
        });

    export const WorkflowAttributeSchema =
        z.object({
            descriptionName: z.string(),
            parentWorkflowId: z.number(),
            baseEntityId: z.number(),
            creationTime: DayjsSchema,
            updateTime: DayjsSchema,
            integer: IntegerSchema.nullish().transform(standardUndefined),
            floating: z.number().nullish().transform(standardUndefined),
            enumeration: z.string().nullish().transform(standardUndefined),
            decimal: DecimalSchema.nullish().transform(standardUndefined),
            date: DayjsSchema.nullish().transform(standardUndefined),
            timestamp: DayjsSchema.nullish().transform(standardUndefined),
            flag: z.boolean().nullish().transform(standardUndefined),
            text: z.string().nullish().transform(standardUndefined),
        });

    export const WorkflowAttributeWithDescriptionSchema = z.object({
        attr: WorkflowAttributeSchema.nullish().transform(standardUndefined),
        description: WorkflowAttributeDescriptionSchema,
    }).transform(attrWithDescription => {
        const attr = attrWithDescription.attr;
        const description = attrWithDescription.description;

        return {
            id: attr?.baseEntityId,
            parentWorkflowId: description.parentWorkflowId,
            refType: description.refType,
            expression: description.expression,
            regex: description.regex,
            maxLength: description.maxLength,
            enumDescription: description.enumDescription,
            ...organizeAttributeFields(attrWithDescription.description.attrType, attr),
            creationTime: attr?.creationTime,
            updateTime: attr?.updateTime,
        }
    });

    export const WorkflowAttributeWithDescriptionListSchema = z.object({
        items: WorkflowAttributeWithDescriptionSchema.array(),
    });

    export const ChangeStateRulesSchema = z.object({
        fromId: z.number(),
        toId: z.number(),
        expressions: z.string().array(),
        creationTime: DayjsSchema,
        updateTime: DayjsSchema,
    });

    export const WorkflowStateSchema = EntitySchema.extend({
        workflowId: z.number(),
        changeRules: ChangeStateRulesSchema.array(),
    });

    export const WorkflowEntitySchema = EntitySchema.extend({
        workflowId: z.number(),
        currentStateId: z.number(),
    });

    export const WorkflowSchema = EntitySchema.extend({
        initialStateId: z.number().nullish().transform(standardUndefined),
    });

    export const RequestBaseEntitySchema = z.object({
        name: z.string(),
    });

    export const RequestNewWorkflowSchema = RequestBaseEntitySchema;

    export const RequestNewWorkflowStateSchema = RequestBaseEntitySchema;

    export const RequestNewworkflowEntitySchema = RequestBaseEntitySchema;

    export const RequestNewAttribute = z.object({
        integer: IntegerSchema.nullish().transform(standardUndefined),
        floating: z.number().nullish().transform(standardUndefined),
        enumeration: z.string().nullish().transform(standardUndefined),
        decimal: DecimalSchema.nullish().transform(standardUndefined),
        date: DayjsSchema.nullish().transform(standardUndefined),
        timestamp: DayjsSchema.nullish().transform(standardUndefined),
        flag: z.boolean().nullish().transform(standardUndefined),
        text: z.string().nullish().transform(standardUndefined),
    });

    export const RequestNewAttributeDescriptionSchema = z.object({
        name: z.string(),
        parentWorkflowId: z.number(),
        refType: z.enum(WORKFLOW_ATTRIBUTE_REFERENCE_TYPES),
        attrType: z.enum(WORKFLOW_ATTRIBUTE_TYPES),
        expression: WorkflowAttributeExprRuleSchema.nullish().transform(standardUndefined),
        regex: WorkflowAttributeRegexRuleSchema.nullish().transform(standardUndefined),
        maxLength: z.number().nullish().transform(standardUndefined),
        enumDescription: z.string().array().nullish().transform(standardUndefined),
    });

    export const RequestUpdateWorkflowConfigSchema = z.object({
        initialStateId: z.number().nullish().transform(standardUndefined),
    });

    function organizeAttributeFields(attrType: WorkflowAttributeType, attr?: z.infer<typeof WorkflowAttributeSchema>) {
        if (!attr) return {
            attrType,
        };

        switch (attrType) {
            case "DATE":
                return {
                attrType,
                value: attr.date,
            }
            case "TIMESTAMP":
                return {
                attrType,
                value: attr.timestamp,
            }
            case "FLAG":
                return {
                attrType,
                value: attr.flag
            }
            case "TEXT":
                return {
                attrType,
                value: attr.text,
            }
            case "INTEGER":
                return {
                attrType,
                value: attr.integer,
            }
            case "DECIMAL":
                return {
                attrType,
                value: attr.decimal,
            }
            case "FLOATING":
                return {
                attrType,
                value: attr.floating,
            }
            case "ENUMERATION":
                return {
                attrType,
                value: attr.enumeration,
            }
        }
    }

    type _verify = [
        Assert<Extends<components["schemas"]["ResponseWorkflow"], z.input<typeof WorkflowSchema>>>,
        Assert<Extends<components["schemas"]["ResponseWorkflowState"], z.input<typeof WorkflowStateSchema>>>,
        Assert<Extends<components["schemas"]["ResponseWorkflowEntity"], z.input<typeof WorkflowEntitySchema>>>,
        Assert<Extends<components["schemas"]["ResponseAttribute"], z.input<typeof WorkflowAttributeSchema>>>,
        Assert<Extends<components["schemas"]["ResponseAttributeDescription"], z.input<typeof WorkflowAttributeDescriptionSchema>>>,
        Assert<Extends<components["schemas"]["ResponseAttributeWithDescription"], z.input<typeof WorkflowAttributeWithDescriptionSchema>>>,
        Assert<Extends<components["schemas"]["ResponseAttributeWithDescriptionList"], z.input<typeof WorkflowAttributeWithDescriptionListSchema>>>,
    ]
}
