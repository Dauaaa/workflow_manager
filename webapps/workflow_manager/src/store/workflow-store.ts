import createClient, { HeadersOptions } from "openapi-fetch";
import type { paths, components } from "workflow_manager_api";
import { z } from "zod";
import {
  DayjsSchema,
  standardUndefined,
  Assert,
  Extends,
  IntegerSchema,
  DecimalSchema,
  IntegerSchemaRev,
  DecimalSchemaRev,
  DayjsTimeSchemaRev,
} from "common_schemas";
// need these empty imports for typing to work
import "dayjs";
import "decimal.js";
import { makeObservable, observable, action } from "mobx";

export interface Authentication {
  clientId: string;
  userId: string;
}

const USER_ID_KEY = "user-id";
const CLIENT_ID_KEY = "client-id";

/**
 * All in one store. It guarantees the application state is in sync with the servers.
 *
 * DISCLAIMER: big file! Consolidating the store logic here helps minimize the exposure
 * of types that are only relevant internally to the store. Breaking it into smaller
 * files for chunking doesn’t offer much benefit, as nearly all store code is needed
 * all the time for this app.
 */
export class WorkflowStore {
  public constructor(workflowManagerService?: WorkflowManagerService) {
    this.workflowManagerService =
      workflowManagerService ?? new WorkflowManagerService();

    this.workflowManagerService.setSeenEvents(this.seenEvents);

    makeObservable<
      WorkflowStore,
      | "upsertWorkflows"
      | "upsertStates"
      | "upsertEntities"
      | "upsertAttributeDescriptions"
      | "upsertAttributes"
      | "authenticationInner"
      | "clear"
    >(this, {
      workflows: observable,
      workflowStates: observable,
      workflowStatesByWorkflow: observable,
      workflowEntities: observable,
      workflowEntitiesByState: observable,
      workflowAttributes: observable,
      attributeDescriptionsByWorkflows: observable,
      stateAttributes: observable,
      entityAttributes: observable,
      authenticationInner: observable,
      upsertWorkflows: action,
      upsertStates: action,
      upsertEntities: action,
      upsertAttributeDescriptions: action,
      upsertAttributes: action,
      setAuthentication: action,
      clear: action,
    });

    const clientId = localStorage.getItem(CLIENT_ID_KEY);
    const userId = localStorage.getItem(USER_ID_KEY);

    const isUuid = (s: string | null): s is string =>
      s ? z.string().uuid().safeParse(s).success : false;

    this.wsWorkflowManager = new WorkflowManagerWebsocketClient(
      this.onWsUpdate,
    );

    if (!isUuid(clientId)) this.setAuthentication();
    else
      this.setAuthentication({
        clientId,
        userId: isUuid(userId) ? userId : self.crypto.randomUUID(),
      });
  }

  private workflowManagerService: WorkflowManagerService;
  private wsWorkflowManager: WorkflowManagerWebsocketClient;
  public workflows: Map<number, Workflow> = new Map();
  public workflowStates: Map<number, WorkflowState> = new Map();
  public workflowStatesByWorkflow: Map<number, Map<number, WorkflowState>> =
    new Map();
  public workflowEntities: Map<number, WorkflowEntity> = new Map();
  public workflowEntitiesByState: Map<number, Map<number, WorkflowEntity>> =
    new Map();
  public attributeDescriptionsByWorkflows: Map<
    number,
    {
      [K in WorkflowAttributeReferenceType]: Map<
        string,
        WorkflowAttributeDescription
      >;
    }
  > = new Map();
  public workflowAttributes: Map<number, Map<string, WorkflowAttribute>> =
    new Map();
  public stateAttributes: Map<number, Map<string, WorkflowAttribute>> =
    new Map();
  public entityAttributes: Map<number, Map<string, WorkflowAttribute>> =
    new Map();

  public getAttributeMapByRefType = (
    refType: WorkflowAttributeReferenceType,
  ) => {
    switch (refType) {
      case "WORKFLOW":
        return this.workflowAttributes;
      case "WORKFLOW_STATE":
        return this.stateAttributes;
      case "WORKFLOW_ENTITY":
        return this.entityAttributes;
    }
  };

  private authenticationInner: { current?: Authentication } = {};

  private seenEvents: Set<string> = new Set();

  private subscriptions: {
    main?: EntityReference;
    minor: EntityReference[];
  } = {
    minor: [],
  };

  public get authentication() {
    return this.authenticationInner;
  }

  public setAuthentication(auth?: Authentication) {
    this.authenticationInner.current = auth;

    if (auth) {
      localStorage.setItem(CLIENT_ID_KEY, auth.clientId);
      localStorage.setItem(USER_ID_KEY, auth.userId);
      this.workflowManagerService.setAuthentication(auth);
    } else {
      localStorage.removeItem(CLIENT_ID_KEY);
      localStorage.removeItem(USER_ID_KEY);
      this.clear();
    }
  }

  private clear() {
    this.wsWorkflowManager.unsubscribeAll();
    this.workflows.clear();
    this.workflowStates.clear();
    this.workflowEntities.clear();
    this.seenEvents.clear();
    this.workflowAttributes.clear();
    this.stateAttributes.clear();
    this.entityAttributes.clear();
    this.attributeDescriptionsByWorkflows.clear();
  }

  public getAttributeDescription = ({
    workflowId,
    refType,
    descriptionName,
  }: {
    workflowId: number;
    refType: WorkflowAttributeReferenceType;
    descriptionName: string;
  }) => {
    return this.attributeDescriptionsByWorkflows
      .get(workflowId)
      ?.[refType].get(descriptionName);
  };

  public getAttribute = ({
    baseEntityId,
    refType,
    descriptionName,
  }: {
    baseEntityId: number;
    refType: WorkflowAttributeReferenceType;
    descriptionName: string;
  }) => {
    return this.mapAttributesByRefType(refType)
      .get(baseEntityId)
      ?.get(descriptionName);
  };

  public getFromIdAndReference = ({
    refType,
    baseEntityId,
  }: {
    refType: WorkflowAttributeReferenceType;
    baseEntityId: number;
  }) => {
    const map = this.mapByRefType(refType);

    return map.get(baseEntityId);
  };

  public createWorkflow = async (
    ...args: Parameters<WorkflowManagerService["createWorkflow"]>
  ) => {
    const workflow = await this.workflowManagerService.createWorkflow(...args);

    this.upsertWorkflows([workflow]);
  };

  public createState = async (
    ...args: Parameters<WorkflowManagerService["createState"]>
  ) => {
    const state = await this.workflowManagerService.createState(...args);

    this.upsertStates([state]);
  };

  public createEntity = async (
    ...args: Parameters<WorkflowManagerService["createEntity"]>
  ) => {
    const entity = await this.workflowManagerService.createEntity(...args);

    this.upsertEntities([entity]);
  };

  public createAttributeDescription = async (
    ...args: Parameters<WorkflowManagerService["createAttributeDescription"]>
  ) => {
    const description =
      await this.workflowManagerService.createAttributeDescription(...args);

    this.upsertAttributeDescriptions(args[0].workflowId, [description]);
  };

  public setAttribute = async (
    ...args: Parameters<WorkflowManagerService["setAttribute"]>
  ) => {
    const attribute = await this.workflowManagerService.setAttribute(...args);

    this.upsertAttributes(args[0].refType, [attribute]);
  };

  public setWorkflowConfig = async (
    ...args: Parameters<WorkflowManagerService["setWorkflowConfig"]>
  ) => {
    const workflow = await this.workflowManagerService.setWorkflowConfig(
      ...args,
    );

    this.upsertWorkflows([workflow]);
  };

  public setChangeRule = async (
    ...args: Parameters<WorkflowManagerService["setChangeRule"]>
  ) => {
    const state = await this.workflowManagerService.setChangeRule(...args);

    this.upsertStates([state]);
  };

  public moveState = async (
    ...args: Parameters<WorkflowManagerService["moveState"]>
  ) => {
    const res = await this.workflowManagerService.moveState(...args);

    this.upsertEntities([res.entity]);
    this.upsertStates([res.from, res.to]);
  };

  public loadAttributeDescriptions = async (workflowId: number) => {
    const descriptions =
      await this.workflowManagerService.getAttributesDescription(workflowId);

    this.upsertAttributeDescriptions(workflowId, descriptions);
  };

  public loadAttributes = async (
    ...args: Parameters<WorkflowManagerService["getAttributes"]>
  ) => {
    this.minorSubscription(args[0].baseEntityId, args[0].refType);

    const attrs = await this.workflowManagerService.getAttributes(...args);

    this.upsertAttributes(args[0].refType, attrs);
  };

  public loadWorkflow = async (workflowId: number) => {
    this.mainSubscription(workflowId);
    const res = await this.workflowManagerService.getWorkflow(workflowId);

    this.upsertWorkflows([res]);
  };

  public loadWorkflows = async () => {
    this.mainSubscription();
    const workflows = await this.workflowManagerService.listWorkflows();

    this.upsertWorkflows(workflows);
  };

  public loadState = async (workflowStateId: number) => {
    const res = await this.workflowManagerService.getState(workflowStateId);

    this.upsertStates([res]);
  };

  public loadStates = async (workflowId: number) => {
    const res =
      await this.workflowManagerService.listStatesByWorkflow(workflowId);

    this.upsertStates(res);
  };

  public loadEntity = async (entityId: number) => {
    const res = await this.workflowManagerService.getEntity(entityId);

    this.upsertEntities([res]);
  };

  public loadEntitiesByState = async (stateId: number) => {
    const entities =
      await this.workflowManagerService.listEntitiesByState(stateId);

    this.upsertEntities(entities);
  };

  private upsertWorkflows = (workflows: Workflow[]) => {
    for (const workflow of workflows) {
      const curWorkflow = this.workflows.get(workflow.id);
      if (!curWorkflow || curWorkflow.updateTime.isBefore(workflow.updateTime))
        this.workflows.set(workflow.id, workflow);
    }
  };

  private upsertStates = (states: WorkflowState[]) => {
    for (const state of states) {
      const curState = this.workflowEntities.get(state.id);
      if (!curState || curState.updateTime.isBefore(state.updateTime)) {
        this.workflowStates.set(state.id, state);

        const curStates = this.workflowStatesByWorkflow.get(state.workflowId);
        if (!curStates)
          this.workflowStatesByWorkflow.set(
            state.workflowId,
            new Map([[state.id, state]]),
          );
        else curStates.set(state.id, state);
      }
    }
  };

  private upsertEntities = (entities: WorkflowEntity[]) => {
    for (const entity of entities) {
      const curEntity = this.workflowEntities.get(entity.id);
      if (!curEntity || curEntity.updateTime.isBefore(entity.updateTime)) {
        this.workflowEntities.set(entity.id, entity);

        if (curEntity && curEntity.currentStateId !== entity.currentStateId)
          this.workflowEntitiesByState
            .get(curEntity.currentStateId)
            ?.delete(entity.id);

        const entitiesByState = this.workflowEntitiesByState.get(
          entity.currentStateId,
        );
        if (!entitiesByState)
          this.workflowEntitiesByState.set(
            entity.currentStateId,
            new Map([[entity.id, entity]]),
          );
        else entitiesByState.set(entity.id, entity);
      }
    }
  };

  private upsertAttributeDescriptions = (
    workflowId: number,
    descriptions: WorkflowAttributeDescription[],
  ) => {
    let descriptionsMap = this.attributeDescriptionsByWorkflows.get(workflowId);
    if (!descriptionsMap) {
      this.attributeDescriptionsByWorkflows.set(workflowId, {
        WORKFLOW: new Map(),
        WORKFLOW_STATE: new Map(),
        WORKFLOW_ENTITY: new Map(),
      });
      // need to get from map again because mobx
      descriptionsMap = this.attributeDescriptionsByWorkflows.get(workflowId)!;
    }

    for (const description of descriptions) {
      const curDescription = descriptionsMap[description.refType].get(
        description.name,
      );
      if (
        !curDescription ||
        curDescription.updateTime.isBefore(description.updateTime)
      )
        descriptionsMap[description.refType].set(description.name, description);
    }
  };

  private upsertAttributes = (
    refType: WorkflowAttributeReferenceType,
    attrs: WorkflowAttribute[],
  ) => {
    let attrMapMyBaseEntityId: typeof this.workflowAttributes;
    switch (refType) {
      case "WORKFLOW": {
        attrMapMyBaseEntityId = this.workflowAttributes;
        break;
      }
      case "WORKFLOW_STATE": {
        attrMapMyBaseEntityId = this.stateAttributes;
        break;
      }
      case "WORKFLOW_ENTITY": {
        attrMapMyBaseEntityId = this.entityAttributes;
      }
    }

    for (const attr of attrs) {
      let attrMapByDescriptionName = attrMapMyBaseEntityId.get(
        attr.baseEntityId,
      );
      if (!attrMapByDescriptionName) {
        attrMapMyBaseEntityId.set(attr.baseEntityId, new Map());
        attrMapByDescriptionName = attrMapMyBaseEntityId.get(
          attr.baseEntityId,
        )!;
      }

      const curAttr = attrMapByDescriptionName.get(attr.descriptionName);
      if (!curAttr || curAttr.updateTime.isBefore(attr.updateTime))
        attrMapByDescriptionName.set(attr.descriptionName, attr);
    }
  };

  private mapByRefType = (refType: WorkflowAttributeReferenceType) => {
    switch (refType) {
      case "WORKFLOW": {
        return this.workflows;
      }
      case "WORKFLOW_STATE": {
        return this.workflowStates;
      }
      case "WORKFLOW_ENTITY": {
        return this.workflowEntities;
      }
    }
  };

  private mapAttributesByRefType = (
    refType: WorkflowAttributeReferenceType,
  ) => {
    switch (refType) {
      case "WORKFLOW": {
        return this.workflowAttributes;
      }
      case "WORKFLOW_STATE": {
        return this.stateAttributes;
      }
      case "WORKFLOW_ENTITY": {
        return this.entityAttributes;
      }
    }
  };

  private onWsUpdate = (update: WebsocketUpdate) => {
    if (update.clientId !== this.authentication.current?.clientId) return;

    switch (update.objType) {
      case "ResponseWorkflow": {
        this.upsertWorkflows([update.obj]);
        return;
      }
      case "ResponseWorkflowState": {
        this.upsertStates([update.obj]);
        return;
      }
      case "ResponseWorkflowEntity": {
        this.upsertEntities([update.obj]);
        return;
      }
      case "ResponseAttributeDescription": {
        this.upsertAttributeDescriptions(update.obj.parentWorkflowId, [
          update.obj,
        ]);
        return;
      }
      case "ResponseAttribute": {
        this.upsertAttributes(update.refType, [update.obj]);
        return;
      }
    }
  };

  private mainSubscription = (workflowId?: number) => {
    if (!this.authentication.current?.clientId) {
      this.wsWorkflowManager.unsubscribeAll();
      return;
    }

    const sub: EntityReference = {
      baseEntityId: workflowId,
      clientId: this.authentication.current?.clientId,
      entitySubscriptionType: "WORKFLOW",
    };

    if (
      this.subscriptions.main &&
      this.subscriptions.main.baseEntityId !== workflowId
    ) {
      this.wsWorkflowManager.unsubscribe([
        this.subscriptions.main,
        ...this.subscriptions.minor,
      ]);
    }

    this.wsWorkflowManager.subscribe([sub]);
    this.subscriptions.main = sub;
  };

  private minorSubscription = (
    baseEntityId: number,
    refType: WorkflowAttributeReferenceType,
  ) => {
    if (!this.authentication.current?.clientId) {
      this.wsWorkflowManager.unsubscribeAll();
      return;
    }

    if (this.subscriptions.minor.length > 5)
      this.wsWorkflowManager.unsubscribe([this.subscriptions.minor.shift()!]);

    const sub: EntityReference = {
      baseEntityId,
      clientId: this.authentication.current.clientId,
      entitySubscriptionType: refType,
      attr: true,
    };
    this.wsWorkflowManager.subscribe([sub]);
    this.subscriptions.minor.push(sub);
  };
}

// TODO: all methods throw on error right now.
// TODO: create error type and return accordingly (need to map some spring boot stuff
// so I'm skipping for now...)
class WorkflowManagerService {
  public createWorkflow = async (newWorkflow: RequestNewWorkflow) => {
    const resParser = parsers.WorkflowSchema;
    // not necessary but good practice since we might need to eventually transform
    // from domain to api format. So this function would always get the domain format
    const parsedNewWorkflow =
      parsers.RequestNewWorkflowSchema.parse(newWorkflow);

    const response = await this.client.POST("/workflows", {
      body: parsedNewWorkflow,
      headers: this.getHeaders(),
    });

    // @ts-ignore
    type _verify = Assert<
      Extends<(typeof response)["data"], z.input<typeof resParser> | undefined>
    >;

    const eventId = response.response.headers.get("event-id");
    if (eventId && this.seenEvents) this.seenEvents.add(eventId);

    return resParser.parse(response?.data);
  };

  public createState = async (
    newState: RequestNewWorkflowState,
    workflowId: number,
  ) => {
    const resParser = parsers.WorkflowStateSchema;
    const parsedNewState =
      parsers.RequestNewWorkflowStateSchema.parse(newState);

    const response = await this.client.POST(
      "/workflows/{workflowId}/workflow-states",
      {
        body: parsedNewState,
        params: {
          path: { workflowId },
        },
        headers: this.getHeaders(),
      },
    );

    // @ts-ignore
    type _verify = Assert<
      Extends<(typeof response)["data"], z.input<typeof resParser> | undefined>
    >;

    const eventId = response.response.headers.get("event-id");
    if (eventId && this.seenEvents) this.seenEvents.add(eventId);

    return resParser.parse(response?.data);
  };

  public createEntity = async (
    newEntity: RequestNewWorkflowEntity,
    workflowId: number,
  ) => {
    const resParser = parsers.WorkflowEntitySchema;
    const parsedNewEntity =
      parsers.RequestNewWorkflowEntitySchema.parse(newEntity);

    const response = await this.client.POST(
      "/workflows/{workflowId}/workflow-entities",
      {
        body: parsedNewEntity,
        params: {
          path: { workflowId },
        },
        headers: this.getHeaders(),
      },
    );

    // @ts-ignore
    type _verify = Assert<
      Extends<(typeof response)["data"], z.input<typeof resParser> | undefined>
    >;

    const eventId = response.response.headers.get("event-id");
    if (eventId && this.seenEvents) this.seenEvents.add(eventId);

    return resParser.parse(response?.data);
  };

  public createAttributeDescription = async ({
    workflowId,
    ...body
  }: { workflowId: number } & z.infer<
    typeof parsers.RequestNewAttributeDescriptionSchema
  >) => {
    const resParser = parsers.WorkflowAttributeDescriptionSchema;
    const response = await this.client.POST(
      "/workflows/{workflowId}/attribute-descriptions",
      {
        params: {
          path: { workflowId },
        },
        body,
        headers: this.getHeaders(),
      },
    );

    // @ts-ignore
    type _verify = Assert<
      Extends<(typeof response)["data"], z.input<typeof resParser> | undefined>
    >;

    const eventId = response.response.headers.get("event-id");
    if (eventId && this.seenEvents) this.seenEvents.add(eventId);

    return resParser.parse(response?.data);
  };

  public setAttribute = async ({
    baseEntityId,
    refType,
    attr,
    attributeName,
  }: {
    baseEntityId: number;
    refType: WorkflowAttributeReferenceType;
    attr: z.infer<typeof parsers.RequestNewAttributeSchema>;
    attributeName: string;
  }) => {
    const resParser = parsers.WorkflowAttributeSchema;
    let response: any;
    switch (refType) {
      case "WORKFLOW": {
        const res = await this.client.PUT(
          "/workflows/{workflowId}/attributes/{attributeName}",
          {
            body: attr,
            params: {
              path: {
                workflowId: baseEntityId,
                attributeName,
              },
            },
            headers: this.getHeaders(),
          },
        );
        response = res;
        // @ts-ignore
        type _verify = Assert<
          Extends<(typeof res)["data"], z.input<typeof resParser> | undefined>
        >;
        break;
      }
      case "WORKFLOW_STATE": {
        const res = await this.client.PUT(
          "/workflow-states/{stateId}/attributes/{attributeName}",
          {
            body: attr,
            params: {
              path: {
                stateId: baseEntityId,
                attributeName,
              },
            },
            headers: this.getHeaders(),
          },
        );
        response = res;
        // @ts-ignore
        type _verify = Assert<
          Extends<(typeof res)["data"], z.input<typeof resParser> | undefined>
        >;
        break;
      }
      case "WORKFLOW_ENTITY": {
        const res = await this.client.PUT(
          "/workflow-entities/{entityId}/attributes/{attributeName}",
          {
            body: attr,
            params: {
              path: {
                entityId: baseEntityId,
                attributeName,
              },
            },
            headers: this.getHeaders(),
          },
        );
        response = res;
        // @ts-ignore
        type _verify = Assert<
          Extends<(typeof res)["data"], z.input<typeof resParser> | undefined>
        >;
        break;
      }
    }

    const eventId = response.response.headers.get("event-id");
    if (eventId && this.seenEvents) this.seenEvents.add(eventId);

    return resParser.parse(response?.data);
  };

  public setWorkflowConfig = async (
    workflowId: number,
    config: RequestUpdateWorkflowConfig,
  ) => {
    const resParser = parsers.WorkflowSchema;
    const parsedConfig =
      parsers.RequestUpdateWorkflowConfigSchema.parse(config);

    const response = await this.client.PUT("/workflows/{workflowId}/config", {
      params: {
        path: { workflowId },
      },
      body: parsedConfig,
      headers: this.getHeaders(),
    });

    // @ts-ignore
    type _verify = Assert<
      Extends<(typeof response)["data"], z.input<typeof resParser> | undefined>
    >;

    const eventId = response.response.headers.get("event-id");
    if (eventId && this.seenEvents) this.seenEvents.add(eventId);

    return resParser.parse(response.data);
  };

  public setChangeRule = async ({
    workflowStateId,
    rule,
  }: {
    workflowStateId: number;
    rule: RequestSetChangeStateRule;
  }) => {
    const resParser = parsers.WorkflowStateSchema;
    const response = await this.client.POST(
      "/workflow-states/{workflowStateId}/rules",
      {
        body: rule,
        params: {
          path: { workflowStateId },
        },
        headers: this.getHeaders(),
      },
    );

    // @ts-ignore
    type _verify = Assert<
      Extends<(typeof response)["data"], z.input<typeof resParser> | undefined>
    >;

    const eventId = response.response.headers.get("event-id");
    if (eventId && this.seenEvents) this.seenEvents.add(eventId);
    // TODO: response error handling

    // TODO: parser error handling
    return resParser.parse(response?.data);
  };

  public moveState = async ({
    entityId,
    newStateId,
  }: {
    entityId: number;
    newStateId: number;
  }) => {
    const resParser = parsers.ResponseEntityChangeStateSchema;
    const response = await this.client.PATCH(
      "/workflow-entities/{entityId}/workflow-states/{newStateId}",
      {
        params: { path: { entityId, newStateId } },
        headers: this.getHeaders(),
      },
    );

    // @ts-ignore
    type _verify = Assert<
      Extends<(typeof response)["data"], z.input<typeof resParser> | undefined>
    >;

    const eventId = response.response.headers.get("event-id");
    if (eventId && this.seenEvents) this.seenEvents.add(eventId);

    return resParser.parse(response?.data);
  };

  public listWorkflows = async () => {
    const resParser = parsers.WorkflowSchema.array();
    const response = await this.client.GET("/workflows", {
      headers: this.getHeaders(),
    });

    // @ts-ignore
    type _verify = Assert<
      Extends<(typeof response)["data"], z.input<typeof resParser> | undefined>
    >;

    // TODO: response error handling

    // TODO: parser error handling
    return resParser.parse(response?.data);
  };

  public listStatesByWorkflow = async (workflowId: number) => {
    const resParser = parsers.WorkflowStateSchema.array();
    const response = await this.client.GET(
      "/workflows/{workflowId}/workflow-states",
      {
        params: {
          path: { workflowId },
        },
        headers: this.getHeaders(),
      },
    );

    // @ts-ignore
    type _verify = Assert<
      Extends<(typeof response)["data"], z.input<typeof resParser> | undefined>
    >;
    // TODO: response error handling

    // TODO: parser error handling
    return resParser.parse(response?.data);
  };

  public listEntitiesByState = async (workflowStateId: number) => {
    const resParser = parsers.WorkflowEntitySchema.array();
    const response = await this.client.GET(
      "/workflow-states/{workflowStateId}/workflow-entities",
      {
        params: {
          path: { workflowStateId },
        },
        headers: this.getHeaders(),
      },
    );

    // @ts-ignore
    type _verify = Assert<
      Extends<(typeof response)["data"], z.input<typeof resParser> | undefined>
    >;

    // TODO: response error handling

    // TODO: parser error handling
    return resParser.parse(response?.data);
  };

  public getAttributes = async ({
    workflowId,
    refType,
    baseEntityId,
  }: {
    workflowId: number;
    refType: WorkflowAttributeReferenceType;
    baseEntityId: number;
  }) => {
    const resParser = parsers.WorkflowAttributeSchema.array();
    let response: any;
    switch (refType) {
      case "WORKFLOW": {
        const res = await this.client.GET(
          "/workflows/{workflowId}/attributes",
          {
            params: {
              path: { workflowId: baseEntityId },
            },
            headers: this.getHeaders(),
          },
        );
        response = res;
        // @ts-ignore
        type _verify = Assert<
          Extends<(typeof res)["data"], z.input<typeof resParser> | undefined>
        >;
        break;
      }
      case "WORKFLOW_STATE": {
        const res = await this.client.GET(
          "/workflow-states/{stateId}/attributes",
          {
            params: {
              path: { stateId: baseEntityId },
            },
            headers: this.getHeaders(),
          },
        );
        response = res;
        // @ts-ignore
        type _verify = Assert<
          Extends<(typeof res)["data"], z.input<typeof resParser> | undefined>
        >;
        break;
      }
      case "WORKFLOW_ENTITY": {
        const res = await this.client.GET(
          "/workflow-entities/{entityId}/attributes",
          {
            params: {
              path: { entityId: baseEntityId },
            },
            headers: this.getHeaders(),
          },
        );
        response = res;
        // @ts-ignore
        type _verify = Assert<
          Extends<(typeof res)["data"], z.input<typeof resParser> | undefined>
        >;
      }
    }

    // TODO: response error handling

    // TODO: parser error handling
    return resParser.parse(response?.data);
  };

  public getAttributesDescription = async (workflowId: number) => {
    const resParser = parsers.WorkflowAttributeDescriptionSchema.array();
    const response = await this.client.GET(
      "/workflows/{workflowId}/attribute-descriptions",
      {
        params: {
          path: { workflowId },
        },
        headers: this.getHeaders(),
      },
    );

    // @ts-ignore
    type _verify = Assert<
      Extends<(typeof response)["data"], z.input<typeof resParser> | undefined>
    >;

    // TODO: response error handling

    // TODO: parser error handling
    return resParser.parse(response?.data);
  };

  public getWorkflow = async (workflowId: number) => {
    const resParser = parsers.WorkflowSchema;
    const response = await this.client.GET("/workflows/{workflowId}", {
      params: {
        path: { workflowId },
      },
      headers: this.getHeaders(),
    });

    // @ts-ignore
    type _verify = Assert<
      Extends<(typeof response)["data"], z.input<typeof resParser> | undefined>
    >;

    // TODO: response error handling

    // TODO: parser error handling
    return resParser.parse(response?.data);
  };

  public getState = async (workflowStateId: number) => {
    const resParser = parsers.WorkflowStateSchema;
    const response = await this.client.GET(
      "/workflow-states/{workflowStateId}",
      {
        params: {
          path: { workflowStateId },
        },
        headers: this.getHeaders(),
      },
    );

    // @ts-ignore
    type _verify = Assert<
      Extends<(typeof response)["data"], z.input<typeof resParser> | undefined>
    >;

    // TODO: response error handling

    // TODO: parser error handling
    return resParser.parse(response?.data);
  };

  public getEntity = async (workflowEntityId: number) => {
    const resParser = parsers.WorkflowEntitySchema;
    const response = await this.client.GET(
      "/workflow-entities/{workflowEntityId}",
      {
        params: {
          path: { workflowEntityId },
        },
        headers: this.getHeaders(),
      },
    );

    // @ts-ignore
    type _verify = Assert<
      Extends<(typeof response)["data"], z.input<typeof resParser> | undefined>
    >;

    // TODO: response error handling

    // TODO: parser error handling
    return resParser.parse(response?.data);
  };

  public setSeenEvents = (seenEvents?: Set<string>) => {
    this.seenEvents = seenEvents;
  };

  public setAuthentication = (authentication?: Authentication) => {
    this.authentication = authentication;
  };

  private getHeaders = (): HeadersOptions => {
    const headers: Record<string, string> = {};

    if (this.authentication) {
      headers[CLIENT_ID_KEY] = this.authentication.clientId;
      headers[USER_ID_KEY] = this.authentication.userId;
    }

    return headers;
  };

  public constructor(client?: ReturnType<typeof createClient<paths>>) {
    this.client =
      client ??
      createClient<paths>({
        baseUrl: import.meta.env.VITE_WORKFLOW_MANAGER_BASE_URL,
      });
  }

  private client: ReturnType<typeof createClient<paths>>;
  private seenEvents?: Set<string>;
  private authentication?: Authentication;
}

export type Workflow = z.infer<typeof parsers.WorkflowSchema>;
export type WorkflowState = z.infer<typeof parsers.WorkflowStateSchema>;
export type WorkflowEntity = z.infer<typeof parsers.WorkflowEntitySchema>;
export type WorkflowAttribute = z.infer<typeof parsers.WorkflowAttributeSchema>;
export type WorkflowAttributeDescription = z.infer<
  typeof parsers.WorkflowAttributeDescriptionSchema
>;
export type ChangeStateRule = z.infer<typeof parsers.ChangeStateRulesSchema>;
export type EntityIdsByState = z.infer<
  typeof parsers.ResponseEntityIdsByStateSchema
>;
export type RequestNewWorkflow = z.input<
  typeof parsers.RequestNewWorkflowSchema
>;
export type RequestNewWorkflowState = z.input<
  typeof parsers.RequestNewWorkflowStateSchema
>;
export type RequestNewWorkflowEntity = z.input<
  typeof parsers.RequestNewWorkflowEntitySchema
>;
export type RequestUpdateWorkflowConfig = z.input<
  typeof parsers.RequestUpdateWorkflowConfigSchema
>;
export type RequestSetChangeStateRule = z.input<
  typeof parsers.RequestSetChangeStateRuleSchema
>;

export const WORKFLOW_ATTRIBUTE_REFERENCE_TYPES = [
  "WORKFLOW",
  "WORKFLOW_STATE",
  "WORKFLOW_ENTITY",
] as const;
export type WorkflowAttributeReferenceType =
  (typeof WORKFLOW_ATTRIBUTE_REFERENCE_TYPES)[number];
export const WorkflowAttributeReferenceTypePretty = {
  WORKFLOW: "Workflow",
  WORKFLOW_STATE: "State",
  WORKFLOW_ENTITY: "Entity",
} as const satisfies Record<WorkflowAttributeReferenceType, string>;
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
export const WorkflowAttributeTypePretty = {
  INTEGER: "integer",
  FLOATING: "floating",
  ENUMERATION: "enumeration",
  DECIMAL: "decimal",
  DATE: "date",
  TIMESTAMP: "timestamp",
  FLAG: "flag",
  TEXT: "text",
} as const satisfies Record<WorkflowAttributeType, string>;

export module parsers {
  const ENTITY_MAX_NAME_LENGTH = 50;

  const EntitySchema = z.object({
    id: z.number(),
    name: z.string().max(ENTITY_MAX_NAME_LENGTH),
    userId: z.string().uuid(),
    clientId: z.string().uuid(),
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

  export const RequestSetChangeStateRuleSchema = z.object({
    toId: z.number(),
    expressions: z.string().array().min(1),
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

  export const ResponseEntityChangeStateSchema = z.object({
    entity: WorkflowEntitySchema,
    from: WorkflowStateSchema,
    to: WorkflowStateSchema,
  });

  export const RequestNewWorkflowSchema = RequestBaseEntitySchema;

  export const RequestNewWorkflowStateSchema = RequestBaseEntitySchema;

  export const RequestNewWorkflowEntitySchema = RequestBaseEntitySchema;

  export const RequestNewAttributeSchema = z.object({
    integer: IntegerSchemaRev.optional(),
    floating: z.number().optional(),
    enumeration: z.string().optional(),
    decimal: DecimalSchemaRev.optional(),
    date: DayjsTimeSchemaRev.optional(),
    timestamp: DayjsTimeSchemaRev.optional(),
    flag: z.boolean().optional(),
    text: z.string().optional(),
  });

  export const RequestNewAttributeDescriptionSchema = z.object({
    name: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
      message:
        "Name must start with letter and include only letters, digits and underscore.",
    }),
    refType: z.enum(WORKFLOW_ATTRIBUTE_REFERENCE_TYPES),
    attrType: z.enum(WORKFLOW_ATTRIBUTE_TYPES),
    expression: WorkflowAttributeExprRuleSchema.optional(),
    regex: WorkflowAttributeRegexRuleSchema.optional(),
    maxLength: z.number().optional(),
    enumDescription: z.string().array().optional(),
  });

  export const RequestUpdateWorkflowConfigSchema = z.object({
    initialStateId: z.number().nullish().transform(standardUndefined),
  });

  export const ResponseEntityIdsByStateSchema = z.object({
    ids: z.number().array(),
    lastCurrentEntitiesChange: DayjsSchema,
  });

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
  ];
}

type EntitySubscriptionType = WorkflowAttributeReferenceType;

interface EntityReference {
  baseEntityId?: number;
  clientId: string;
  entitySubscriptionType: EntitySubscriptionType;
  attr?: boolean;
}

const MESSAGE_TYPES = ["UPDATE"] as const;

type WebsocketUpdate = z.infer<typeof WebsocketUpdateSchema>;
const WebsocketUpdateSchema = z.preprocess(
  (obj) => {
    if (typeof obj !== "string") return z.NEVER;
    try {
      return JSON.parse(obj);
    } catch {
      return z.NEVER;
    }
  },
  z
    .object({
      msgType: z.enum(MESSAGE_TYPES),
      refType: z.enum(WORKFLOW_ATTRIBUTE_REFERENCE_TYPES),
      baseEntityId: z.number(),
      clientId: z.string().uuid(),
      userId: z.string().uuid(),
      eventId: z.string().uuid(),
    })
    .and(
      z
        .object({
          obj: parsers.WorkflowSchema,
          objType: z.literal("ResponseWorkflow"),
        })
        .or(
          z.object({
            obj: parsers.WorkflowStateSchema,
            objType: z.literal("ResponseWorkflowState"),
          }),
        )
        .or(
          z.object({
            obj: parsers.WorkflowEntitySchema,
            objType: z.literal("ResponseWorkflowEntity"),
          }),
        )
        .or(
          z.object({
            obj: parsers.WorkflowAttributeSchema,
            objType: z.literal("ResponseAttribute"),
          }),
        )
        .or(
          z.object({
            obj: parsers.WorkflowAttributeDescriptionSchema,
            objType: z.literal("ResponseAttributeDescription"),
          }),
        ),
    ),
);

const referencesToKeyString = (references: EntityReference[]) => {
  const keys: string[] = [];

  for (const reference of references) {
    const keyParts = [reference.clientId, reference.entitySubscriptionType];
    if (reference.baseEntityId)
      keyParts.push(reference.baseEntityId.toString());
    if (reference.attr) keyParts.push("attr");

    keys.push(keyParts.join(":"));
  }

  return keys.join(";");
};

class WorkflowManagerWebsocketClient {
  public subscribe = (references: EntityReference[]) => {
    this.dispatchSend("S " + referencesToKeyString(references));
  };

  public unsubscribe = (references: EntityReference[]) => {
    this.dispatchSend("D " + referencesToKeyString(references));
  };

  public unsubscribeAll = () => {
    this.dispatchSend("D D");
  };

  public constructor(onUpdate: (arg: WebsocketUpdate) => void) {
    // will connect in method this.connect(), this is just for typescript...
    this.onUpdate = onUpdate;
    this.socket = undefined as unknown as WebSocket;

    this.connect();
  }

  private connect() {
    this.socket = new WebSocket(import.meta.env.VITE_WORKFLOW_MANAGER_WS_URL);

    this.socket.onopen = () => {
      this.ping();
      this.flushMessageBuffer();
    };

    this.socket.onmessage = (e) => {
      if (e.data === "pong") {
        clearTimeout(this.pingTimeout);
        setTimeout(() => this.ping(), 10000);
        return;
      }

      this.onUpdate(WebsocketUpdateSchema.parse(e.data));
    };
  }

  private ping = () => {
    this.socket.send("ping");

    this.pingTimeout = setTimeout(() => {
      // pong expired, try to connect again

      this.socket.close();
      this.connect();
    }, 30000);
  };

  private dispatchSend = (message: string) => {
    if (this.socket.readyState !== WebSocket.OPEN)
      this.messageBuffer.push(message);
    else this.socket.send(message);
  };

  private flushMessageBuffer = () => {
    while (this.messageBuffer.length > 0) {
      if (this.socket.readyState === WebSocket.OPEN)
        this.socket.send(this.messageBuffer.shift()!);
    }
  };

  private messageBuffer: string[] = [];

  private socket: WebSocket;
  private pingTimeout?: ReturnType<typeof setTimeout>;
  private onUpdate: (arg: WebsocketUpdate) => void;
}
