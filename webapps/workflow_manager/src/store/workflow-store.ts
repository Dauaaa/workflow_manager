import createClient from "openapi-fetch";
import type { paths, components } from "workflow_manager_api";
import { z } from "zod";
import {
  DayjsSchema,
  standardUndefined,
  Assert,
  Extends,
  IntegerSchema,
  DecimalSchema,
} from "common_schemas";
// need these empty imports for typing to work
import "dayjs";
import "decimal.js";
import { makeObservable, observable, action } from "mobx";

/**
 * All in one store. It guarantees the application state is in sync with the servers.
 *
 * DISCLAIMER: big file! Consolidating the store logic here helps minimize the exposure
 * of types that are only relevant internally to the store. Breaking it into smaller
 * files for chunking doesn’t offer much benefit, as nearly all store code is needed
 * all the time for this app.
 *
 * This store will always result in an API call, the application should be careful
 * to only use the load functions once (on component render). The store will take care
 * of syncing according to websocket updates. Intended use of the store:
 *
 * // in the top of the page, declare your "dependencies"
 * useEffect(() => { void store.loadWorkflows(); return () => store.unsub("workflows") }, [])
 */
export class WorkflowStore {
  public constructor(workflowManagerService?: WorkflowManagerService) {
    this.workflowManagerService =
      workflowManagerService ?? new WorkflowManagerService();

    makeObservable<
      WorkflowStore,
      | "upsertWorkflow"
      | "upsertState"
      | "upsertEntity"
      | "upsertWorkflows"
      | "upsertEntities"
    >(this, {
      workflows: observable,
      workflowStates: observable,
      workflowEntities: observable,
      workflowAttributes: observable,
      stateAttributes: observable,
      entityAttributes: observable,
      workflowsIdByEntityIds: observable,
      stateIdByEntityIds: observable,
      workflowEntityIdsByState: observable,
      upsertWorkflow: action,
      upsertState: action,
      upsertEntity: action,
      upsertWorkflows: action,
      upsertEntities: action,
    });
  }

  public workflowManagerService: WorkflowManagerService;
  public workflows: Map<number, Workflow> = new Map();
  public workflowStates: Map<number, WorkflowState> = new Map();
  public workflowEntities: Map<number, WorkflowEntity> = new Map();
  public workflowAttributes: Map<number, Map<string, WorkflowAttribute>> =
    new Map();
  public stateAttributes: Map<number, Map<string, WorkflowAttribute>> =
    new Map();
  public entityAttributes: Map<number, Map<string, WorkflowAttribute>> =
    new Map();

  /** map from entityId -> workflowId */
  public workflowsIdByEntityIds: Map<number, number> = new Map();
  /** map from entityId -> currentStateId */
  public stateIdByEntityIds: Map<number, number> = new Map();
  /** map from stateId -> id of all entities with currentStateId = stateId */
  public workflowEntityIdsByState: Map<number, EntityIdsByState> = new Map();

  public createWorkflow = async (
    ...args: Parameters<WorkflowManagerService["createWorkflow"]>
  ) => {
    const workflow = await this.workflowManagerService.createWorkflow(...args);

    this.upsertWorkflow({ workflow, attrs: [] });
  };

  public loadWorkflow = async (workflowId: number) => {
    const res = await this.workflowManagerService.getWorkflow(workflowId);

    this.upsertWorkflow(res);
  };

  public loadWorkflows = async () => {
    const workflows = await this.workflowManagerService.listWorkflows();

    this.upsertWorkflows(workflows);
  };

  public loadState = async (workflowStateId: number) => {
    const res =
      await this.workflowManagerService.getWorkflowState(workflowStateId);

    this.upsertState(res);
  };

  public loadEntity = async (entityId: number) => {
    const res = await this.workflowManagerService.getWorkflowEntity(entityId);

    this.upsertEntity(res);
  };

  public getNextWorkflowsByState = async (stateId: number) => {
    await this.loadState(stateId);

    const idsToFetch = [];

    for (const id of this.workflowEntityIdsByState.get(stateId)?.ids ?? []) {
      if (!this.workflowEntities.has(id)) {
        idsToFetch.push(id);
        if (idsToFetch.length > 50) break;
      }
    }

    const entities =
      await this.workflowManagerService.listWorkflowEntitiesByIds(idsToFetch);

    this.upsertEntities(entities);
  };

  private upsertWorkflow = ({
    workflow,
    attrs,
  }: {
    workflow: Workflow;
    attrs: WorkflowAttribute[];
  }) => {
    let curWorkflow = this.workflows.get(workflow.id);
    if (!curWorkflow || curWorkflow.updateTime.isBefore(workflow.updateTime))
      this.workflows.set(workflow.id, workflow);

    let curWorkflowAttrs = this.workflowAttributes.get(workflow.id);
    if (!curWorkflowAttrs) {
      this.workflowAttributes.set(
        workflow.id,
        new Map(attrs.map((attr) => [attr.name, attr])),
      );
    } else {
      for (const attr of attrs) {
        let curAttr = curWorkflowAttrs.get(attr.name);
        if (!curAttr || curAttr.updateTime.isBefore(attr.updateTime))
          curWorkflowAttrs.set(attr.name, attr);
      }
    }
  };

  private upsertState = ({
    state,
    attrs,
    entityIds,
  }: {
    state: WorkflowState;
    attrs: WorkflowAttribute[];
    entityIds: EntityIdsByState;
  }) => {
    let curState = this.workflowStates.get(state.id);
    if (!curState || curState.updateTime.isBefore(state.updateTime))
      this.workflowStates.set(state.id, state);

    let curEntityIds = this.workflowEntityIdsByState.get(state.id);
    if (
      !curEntityIds ||
      curEntityIds.lastCurrentEntitiesChange.isBefore(
        entityIds.lastCurrentEntitiesChange,
      )
    )
      this.workflowEntityIdsByState.set(state.id, entityIds);

    let curStateAttrs = this.stateAttributes.get(state.id);
    if (!curStateAttrs) {
      this.stateAttributes.set(
        state.id,
        new Map(attrs.map((attr) => [attr.name, attr])),
      );
    } else {
      for (const attr of attrs) {
        let curAttr = curStateAttrs.get(attr.name);
        if (!curAttr || curAttr.updateTime.isBefore(attr.updateTime))
          curStateAttrs.set(attr.name, attr);
      }
    }
  };

  private upsertEntity = ({
    entity,
    attrs,
  }: {
    entity: WorkflowEntity;
    attrs: WorkflowAttribute[];
  }) => {
    let curEntity = this.workflowEntities.get(entity.id);
    if (!curEntity || curEntity.updateTime.isBefore(entity.updateTime)) {
      this.workflowEntities.set(entity.id, entity);
      this.workflowsIdByEntityIds.set(entity.id, entity.workflowId);
      this.stateIdByEntityIds.set(entity.id, entity.currentStateId);
    }

    let curStateAttrs = this.entityAttributes.get(entity.id);
    if (!curStateAttrs) {
      this.entityAttributes.set(
        entity.id,
        new Map(attrs.map((attr) => [attr.name, attr])),
      );
    } else {
      for (const attr of attrs) {
        let curAttr = curStateAttrs.get(attr.name);
        if (!curAttr || curAttr.updateTime.isBefore(attr.updateTime))
          curStateAttrs.set(attr.name, attr);
      }
    }
  };

  private upsertWorkflows = (workflows: Workflow[]) => {
    for (const workflow of workflows) {
      let curWorkflow = this.workflows.get(workflow.id);
      if (!curWorkflow || curWorkflow.updateTime.isBefore(workflow.updateTime))
        this.workflows.set(workflow.id, workflow);
    }
  };

  private upsertEntities = (entities: WorkflowEntity[]) => {
    for (const entity of entities) {
      let curEntity = this.workflowEntities.get(entity.id);
      if (!curEntity || curEntity.updateTime.isBefore(entity.updateTime)) {
        this.workflowEntities.set(entity.id, entity);
        this.workflowsIdByEntityIds.set(entity.id, entity.workflowId);
        this.stateIdByEntityIds.set(entity.id, entity.currentStateId);
      }
    }
  };
}

// TODO: all methods throw on error right now.
// TODO: create error type and return accordingly (need to map some spring boot stuff
// so I'm skipping for now...)
class WorkflowManagerService {
  public createWorkflow = async (newWorkflow: RequestNewWorkflow) => {
    // not necessary but good practice since we might need to eventually transform
    // from domain to api format. So this function would always get the domain format
    const parsedNewWorkflow =
      parsers.RequestNewWorkflowSchema.parse(newWorkflow);

    const response = await this.client.POST("/workflows", {
      body: parsedNewWorkflow,
    });

    return parsers.WorkflowSchema.parse(response?.data);
  };

  public getWorkflow = async (workflowId: number) => {
    const [workflow, attrs] = await Promise.all([
      this.getWorkflowInner(workflowId),
      this.getWorkflowAttributes(workflowId),
    ]);

    return {
      workflow,
      attrs: attrs.items,
    };
  };

  public getWorkflowState = async (workflowStateId: number) => {
    const [state, attrs, entityIds] = await Promise.all([
      this.getWorkflowStateInner(workflowStateId),
      this.getWorkflowStateAttributes(workflowStateId),
      this.listWorkflowEntityIdsByWorkflowStateId(workflowStateId),
    ]);

    return {
      state,
      attrs: attrs.items,
      entityIds,
    };
  };

  public getWorkflowEntity = async (workflowEntityId: number) => {
    const [entity, attrs] = await Promise.all([
      this.getWorkflowEntityInner(workflowEntityId),
      this.getWorkflowEntityAttributes(workflowEntityId),
    ]);

    return {
      entity,
      attrs: attrs.items,
    };
  };

  public listWorkflows = async () => {
    const response = await this.client.GET("/workflows");

    // TODO: response error handling

    // TODO: parser error handling
    return parsers.WorkflowSchema.array().parse(response?.data);
  };

  public listWorkflowStates = async (workflowStateId: number) => {
    const response = await this.client.GET(
      "/workflow-states/{workflowStateId}",
      {
        params: {
          path: { workflowStateId },
        },
      },
    );

    // TODO: response error handling

    // TODO: parser error handling
    return parsers.WorkflowStateSchema.parse(response?.data);
  };

  public listWorkflowEntitiesByIds = async (ids: number[]) => {
    const response = await this.client.POST("/workflow-entities/list", {
      body: {
        ids,
      },
    });

    // TODO: response error handling

    // TODO: parser error handling
    return parsers.WorkflowEntitySchema.array().parse(response?.data);
  };

  public listWorkflowEntityIdsFromWorkflowId = async (workflowId: number) => {
    const response = await this.client.GET(
      "/workflows/{workflowId}/workflow-entities/ids",
      {
        params: {
          path: { workflowId },
        },
      },
    );

    // TODO: response error handling

    // TODO: parser error handling
    return z.number().array().parse(response?.data);
  };

  public listWorkflowEntityIdsByWorkflowStateId = async (
    workflowStateId: number,
  ) => {
    const response = await this.client.GET(
      "/workflow-states/{workflowStateId}/workflow-entities/ids",
      {
        params: {
          path: { workflowStateId },
        },
      },
    );

    // TODO: response error handling

    // TODO: parser error handling
    return parsers.ResponseEntityIdsByStateSchema.parse(response?.data);
  };

  public constructor(client?: ReturnType<typeof createClient<paths>>) {
    console.log({ url: import.meta.env.VITE_WORKFLOW_MANAGER_BASE_URL });

    this.client =
      client ??
      createClient<paths>({
        baseUrl: import.meta.env.VITE_WORKFLOW_MANAGER_BASE_URL,
      });
  }

  private client;

  private getWorkflowAttributes = async (workflowId: number) => {
    const response = await this.client.GET(
      "/workflows/{workflowId}/attributes",
      {
        params: {
          path: { workflowId },
        },
      },
    );

    // TODO: response error handling

    // TODO: parser error handling
    return parsers.WorkflowAttributeWithDescriptionListSchema.parse(
      response?.data,
    );
  };

  private getWorkflowInner = async (workflowId: number) => {
    const response = await this.client.GET("/workflows/{workflowId}", {
      params: {
        path: { workflowId },
      },
    });

    // TODO: response error handling

    // TODO: parser error handling
    return parsers.WorkflowSchema.parse(response?.data);
  };

  private getWorkflowStateAttributes = async (stateId: number) => {
    const response = await this.client.GET(
      "/workflow-states/{stateId}/attributes",
      {
        params: {
          path: { stateId },
        },
      },
    );

    // TODO: response error handling

    // TODO: parser error handling
    return parsers.WorkflowAttributeWithDescriptionListSchema.parse(
      response?.data,
    );
  };

  private getWorkflowStateInner = async (workflowStateId: number) => {
    const response = await this.client.GET(
      "/workflow-states/{workflowStateId}",
      {
        params: {
          path: { workflowStateId },
        },
      },
    );

    // TODO: response error handling

    // TODO: parser error handling
    return parsers.WorkflowStateSchema.parse(response?.data);
  };

  private getWorkflowEntityAttributes = async (entityId: number) => {
    const response = await this.client.GET(
      "/workflow-entities/{entityId}/attributes",
      {
        params: {
          path: { entityId },
        },
      },
    );

    // TODO: response error handling

    // TODO: parser error handling
    return parsers.WorkflowAttributeWithDescriptionListSchema.parse(
      response?.data,
    );
  };

  private getWorkflowEntityInner = async (workflowEntityId: number) => {
    const response = await this.client.GET(
      "/workflow-entities/{workflowEntityId}",
      {
        params: {
          path: { workflowEntityId },
        },
      },
    );

    // TODO: response error handling

    // TODO: parser error handling
    return parsers.WorkflowEntitySchema.parse(response?.data);
  };
}

export type Workflow = z.infer<typeof parsers.WorkflowSchema>;
export type WorkflowState = z.infer<typeof parsers.WorkflowStateSchema>;
export type WorkflowEntity = z.infer<typeof parsers.WorkflowEntitySchema>;
export type WorkflowAttribute = z.infer<
  typeof parsers.WorkflowAttributeWithDescriptionSchema
>;
export type EntityIdsByState = z.infer<
  typeof parsers.ResponseEntityIdsByStateSchema
>;
export type RequestNewWorkflow = z.input<
  typeof parsers.RequestNewWorkflowSchema
>;

export const WORKFLOW_ATTRIBUTE_REFERENCE_TYPES = [
  "WORKFLOW",
  "WORKFLOW_STATE",
  "WORKFLOW_ENTITY",
] as const;
export type WorkflowAttributeReferenceType =
  (typeof WORKFLOW_ATTRIBUTE_REFERENCE_TYPES)[number];
export const WORKFLOW_ATTRIBUTE_TYPES = [
  "INTEGER",
  "FLOATING",
  "ENUMERATION",
  "DECIMAL",
  "DATE",
  "TIMESTAMP",
  "FLAG",
  "TEXT",
] as const;
export type WorkflowAttributeType = (typeof WORKFLOW_ATTRIBUTE_TYPES)[number];

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

  export const WorkflowAttributeRuleSchema = z.object({
    rule: z.string().nullish().transform(standardUndefined),
    description: z.string().nullish().transform(standardUndefined),
    errorText: z.string().nullish().transform(standardUndefined),
  });

  export const WorkflowAttributeExprRuleSchema = WorkflowAttributeRuleSchema;
  export const WorkflowAttributeRegexRuleSchema = WorkflowAttributeRuleSchema;

  export const WorkflowAttributeDescriptionSchema = z.object({
    name: z.string(),
    parentWorkflowId: z.number(),
    refType: z.enum(WORKFLOW_ATTRIBUTE_REFERENCE_TYPES),
    attrType: z.enum(WORKFLOW_ATTRIBUTE_TYPES),
    creationTime: DayjsSchema,
    updateTime: DayjsSchema,
    expression:
      WorkflowAttributeExprRuleSchema.nullish().transform(standardUndefined),
    regex:
      WorkflowAttributeRegexRuleSchema.nullish().transform(standardUndefined),
    maxLength: z.number().nullish().transform(standardUndefined),
    enumDescription: z.string().array().nullish().transform(standardUndefined),
  });

  export const WorkflowAttributeSchema = z.object({
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

  // TODO: this won't sync correctly, will have to split
  // attributes from descriptions (both here and service)
  export const WorkflowAttributeWithDescriptionSchema = z
    .object({
      attr: WorkflowAttributeSchema.nullish().transform(standardUndefined),
      description: WorkflowAttributeDescriptionSchema,
    })
    .transform((attrWithDescription) => {
      const attr = attrWithDescription.attr;
      const description = attrWithDescription.description;
      let updateTime = description.updateTime;
      if (attr?.updateTime && description.updateTime < attr.updateTime)
        updateTime = attr.updateTime;

      return {
        name: description.name,
        id: attr?.baseEntityId,
        parentWorkflowId: description.parentWorkflowId,
        refType: description.refType,
        expression: description.expression,
        regex: description.regex,
        maxLength: description.maxLength,
        enumDescription: description.enumDescription,
        ...deserializeAttributeFields(
          attrWithDescription.description.attrType,
          attr,
        ),
        updateTime,
      };
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
    expression:
      WorkflowAttributeExprRuleSchema.nullish().transform(standardUndefined),
    regex:
      WorkflowAttributeRegexRuleSchema.nullish().transform(standardUndefined),
    maxLength: z.number().nullish().transform(standardUndefined),
    enumDescription: z.string().array().nullish().transform(standardUndefined),
  });

  export const RequestUpdateWorkflowConfigSchema = z.object({
    initialStateId: z.number().nullish().transform(standardUndefined),
  });

  export const ResponseEntityIdsByStateSchema = z.object({
    ids: z.number().array(),
    lastCurrentEntitiesChange: DayjsSchema,
  });

  function deserializeAttributeFields(
    attrType: WorkflowAttributeType,
    attr?: z.infer<typeof WorkflowAttributeSchema>,
  ) {
    if (!attr)
      return {
        attrType,
      };

    switch (attrType) {
      case "DATE":
        return {
          attrType,
          value: attr.date,
        };
      case "TIMESTAMP":
        return {
          attrType,
          value: attr.timestamp,
        };
      case "FLAG":
        return {
          attrType,
          value: attr.flag,
        };
      case "TEXT":
        return {
          attrType,
          value: attr.text,
        };
      case "INTEGER":
        return {
          attrType,
          value: attr.integer,
        };
      case "DECIMAL":
        return {
          attrType,
          value: attr.decimal,
        };
      case "FLOATING":
        return {
          attrType,
          value: attr.floating,
        };
      case "ENUMERATION":
        return {
          attrType,
          value: attr.enumeration,
        };
    }
  }

  type _verify = [
    Assert<
      Extends<
        components["schemas"]["ResponseWorkflow"],
        z.input<typeof WorkflowSchema>
      >
    >,
    Assert<
      Extends<
        components["schemas"]["ResponseWorkflowState"],
        z.input<typeof WorkflowStateSchema>
      >
    >,
    Assert<
      Extends<
        components["schemas"]["ResponseWorkflowEntity"],
        z.input<typeof WorkflowEntitySchema>
      >
    >,
    Assert<
      Extends<
        components["schemas"]["ResponseAttribute"],
        z.input<typeof WorkflowAttributeSchema>
      >
    >,
    Assert<
      Extends<
        components["schemas"]["ResponseAttributeDescription"],
        z.input<typeof WorkflowAttributeDescriptionSchema>
      >
    >,
    Assert<
      Extends<
        components["schemas"]["ResponseAttributeWithDescription"],
        z.input<typeof WorkflowAttributeWithDescriptionSchema>
      >
    >,
    Assert<
      Extends<
        components["schemas"]["ResponseAttributeWithDescriptionList"],
        z.input<typeof WorkflowAttributeWithDescriptionListSchema>
      >
    >,
    Assert<
      Extends<
        components["schemas"]["ResponseEntityIdsByState"],
        z.input<typeof ResponseEntityIdsByStateSchema>
      >
    >,
  ];
}
