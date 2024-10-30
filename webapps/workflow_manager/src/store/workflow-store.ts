import createClient from "openapi-fetch";
import type { paths, components } from "workflow_manager_api";
import { z } from "zod";
import { DayjsSchema, standardUndefined, DayjsTimeSchemaRev, Assert, Equal, Extends, IntegerSchema, DecimalSchema, } from "common_schemas";

const client = createClient<paths>({ baseUrl: import.meta.env.VITE_WORKFLOW_MANAGER_BASE_URL });

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
            parentWorkflowId: description.parentWorkflowId,
            refType: description.refType,
            expression: description.expression,
            regex: description.regex,
            maxLength: description.maxLength,
            enumDescription: description.enumDescription,
            ...organizeAttributeFields(attrWithDescription.description.attrType, attr),
            baseEntityId: attr?.baseEntityId,
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
    });

    export const WorkflowStateSchema = EntitySchema.extend({
        workflowId: z.number(),
        fromRules: ChangeStateRulesSchema.array(),
        toRules: ChangeStateRulesSchema.array(),
    });

    export const WorkflowEntitySchema = EntitySchema.extend({
        workflowId: z.number(),
        currentStateId: z.number(),
    });

    export const WorkflowSchema = EntitySchema.extend({
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
