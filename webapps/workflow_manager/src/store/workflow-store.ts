import createClient from "openapi-fetch";
import type { paths, components } from "workflow_manager_api";
import { z } from "zod";
import { DayjsSchema, standardUndefined, DayjsTimeSchemaRev } from "common_schemas";

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
    private workflowsMap: Map<number, void> = new Map();
}

module parsers {
    const ENTITY_MAX_NAME_LENGTH = 50;

    const EntitySchema = {
        from: z.object({
            id: z.number(),
            name: z.string().max(ENTITY_MAX_NAME_LENGTH),
            userId: z.number(),
            clientId: z.number(),
            creationTime: DayjsSchema,
            updateTime: DayjsSchema,
            deletionTime: DayjsSchema.nullish().transform(standardUndefined),
        }),
        to: z.object({
            id: z.number(),
            name: z.string().max(ENTITY_MAX_NAME_LENGTH),
            userId: z.number(),
            clientId: z.number(),
            creationTime: DayjsTimeSchemaRev,
            updateTime: DayjsTimeSchemaRev,
            deletionTime: DayjsTimeSchemaRev.nullish().transform(standardUndefined),
        })
    }

    export const WorkflowAttributeSchema = { 
        from: EntitySchema.from.extend({
            integer: z.number().nullish().transform(standardUndefined),
            floating: z.number().nullish().transform(standardUndefined),
            enumeration: z.string().nullish().transform(standardUndefined),
        }),
        to: EntitySchema.to.extend({}),
    };

    export const WorkflowStateSchema = {
        from: EntitySchema.from.extend({}),
        to: EntitySchema.to.extend({}),
    };

    export const WorkflowSchema = {
        from: EntitySchema.from.extend({
            initialState: WorkflowStateSchema.from.nullish().transform(standardUndefined),
            initialStateId: z.number().nullish().transform(standardUndefined),
            attrs: WorkflowAttributeSchema.from.array().nullish().transform(standardUndefined),
        }),
        to: EntitySchema.to.extend({
            initialState: WorkflowStateSchema.to.nullish().transform(standardUndefined),
            initialStateId: z.number().nullish().transform(standardUndefined),
            attrs: WorkflowAttributeSchema.to.array().nullish().transform(standardUndefined),
        }),
    };
}
