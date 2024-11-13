import createClient, { HeadersOptions } from "openapi-fetch";
import type { paths } from "workflow_manager_api";
import { z } from "zod";
import {
  DayjsTimeSchema,
  DayjsDateSchema,
  standardUndefined,
  Assert,
  Extends,
  IntegerSchema,
  DecimalSchema,
  IntegerSchemaRev,
  DecimalSchemaRev,
  DayjsTimeSchemaRev,
  UnionToIntersection,
  PartialPick,
  DayjsDateSchemaRev,
} from "common_schemas";
// need these empty imports for typing to work
import "dayjs";
import "decimal.js";
import { makeObservable, observable, action } from "mobx";
import { v4 } from "uuid";

export interface Authentication {
  clientId: string;
  userId: string;
}

const USER_ID_KEY = "user-id";
const CLIENT_ID_KEY = "client-id";
const REGISTERED_SESSIONS_KEY = "registered-sessions";

// simple types for user feedback
type RequestStatus = "OK" | "ERROR" | "LOADING";
type RequestStatusMap<T> = UnionToIntersection<
  keyof T extends infer K
    ? K extends keyof T
      ? T[K] extends (...args: any) => Promise<any>
        ? { [Key in K]: Map<string, RequestStatus> }
        : never
      : never
    : never
>;

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
      | "updateRequestStatus"
      | "addSession"
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
      requestStatus: observable,
      registeredSessions: observable,
      upsertWorkflows: action,
      upsertStates: action,
      upsertEntities: action,
      upsertAttributeDescriptions: action,
      upsertAttributes: action,
      setAuthentication: action,
      clear: action,
      updateRequestStatus: action,
      addSession: action,
      removeSession: action,
    });

    this.wsWorkflowManager = new WorkflowManagerWebsocketClient(
      this.onWsUpdate,
    );

    const clientId = localStorage.getItem(CLIENT_ID_KEY);
    const userId = localStorage.getItem(USER_ID_KEY);

    const isUuid = (s: string | null): s is string =>
      s ? z.string().uuid().safeParse(s).success : false;

    if (!isUuid(clientId)) this.setAuthentication();
    else
      this.setAuthentication({
        clientId,
        userId: isUuid(userId) ? userId : v4(),
      });

    const registeredSessions = localStorage.getItem(REGISTERED_SESSIONS_KEY);

    if (registeredSessions) {
      const UUIDSchema = z.string().uuid();

      for (const session of registeredSessions.split(";")) {
        const parsedSession = UUIDSchema.safeParse(session);

        if (
          parsedSession?.data &&
          !this.registeredSessions.has(parsedSession.data)
        )
          this.registeredSessions.set(
            parsedSession.data,
            this.registeredSessions.size,
          );
      }
      const curClientId = this.authentication.current?.clientId;
      if (curClientId && !this.registeredSessions.has(curClientId))
        this.registeredSessions.set(curClientId, this.registeredSessions.size);

      this.updateLocalStorageSession();
    }
  }

  private workflowManagerService: WorkflowManagerService;
  private wsWorkflowManager: WorkflowManagerWebsocketClient;
  public registeredSessions: Map<string, number> = new Map();
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

  // omit request status otherwise the type will be recursive
  public requestStatus: RequestStatusMap<Omit<WorkflowStore, "requestStatus">> =
    {
      loadState: new Map(),
      moveState: new Map(),
      loadEntity: new Map(),
      loadStates: new Map(),
      createState: new Map(),
      createEntity: new Map(),
      loadWorkflow: new Map(),
      setAttribute: new Map(),
      loadWorkflows: new Map(),
      setChangeRule: new Map(),
      createWorkflow: new Map(),
      loadAttributes: new Map(),
      setWorkflowConfig: new Map(),
      loadEntitiesByState: new Map(),
      loadAttributeDescriptions: new Map(),
      createAttributeDescription: new Map(),
    };

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

  public setAuthentication(auth?: PartialPick<Authentication, "userId">) {
    this.authenticationInner.current = auth
      ? {
          clientId: auth.clientId,
          userId: auth.userId ?? v4(),
        }
      : undefined;

    if (this.authenticationInner.current) {
      localStorage.setItem(
        CLIENT_ID_KEY,
        this.authenticationInner.current.clientId,
      );
      localStorage.setItem(
        USER_ID_KEY,
        this.authenticationInner.current.userId,
      );
      this.workflowManagerService.setAuthentication(
        this.authenticationInner.current,
      );
      this.addSession(this.authenticationInner.current.clientId);
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
    if (!this.authentication.current?.clientId) return;

    const map = this.mapByRefType(refType);

    return map.get(baseEntityId);
  };

  public createWorkflow = async (
    arg: Parameters<WorkflowManagerService["createWorkflow"]>[0],
  ) => {
    if (!this.authentication.current?.clientId) return;

    this.updateRequestStatus("createWorkflow", arg, "LOADING");
    const workflow = await this.workflowManagerService.createWorkflow(arg);

    if (workflow.success) {
      this.updateRequestStatus("createWorkflow", arg, "OK");
      this.upsertWorkflows([workflow.data]);
    } else {
      this.updateRequestStatus("createWorkflow", arg, "ERROR");
    }
  };

  public createState = async (
    arg: Parameters<WorkflowManagerService["createState"]>[0],
  ) => {
    if (!this.authentication.current?.clientId) return;

    this.updateRequestStatus("createState", arg, "LOADING");
    const state = await this.workflowManagerService.createState(arg);

    if (state.success) {
      this.updateRequestStatus("createState", arg, "OK");
      this.upsertStates([state.data]);
    } else {
      this.updateRequestStatus("createState", arg, "ERROR");
    }
  };

  public createEntity = async (
    arg: Parameters<WorkflowManagerService["createEntity"]>[0],
  ) => {
    if (!this.authentication.current?.clientId) return;

    this.updateRequestStatus("createEntity", arg, "LOADING");
    const entity = await this.workflowManagerService.createEntity(arg);

    if (entity.success) {
      this.updateRequestStatus("createEntity", arg, "OK");
      this.upsertEntities([entity.data]);
    } else {
      this.updateRequestStatus("createEntity", arg, "ERROR");
    }
  };

  public createAttributeDescription = async (
    arg: Parameters<WorkflowManagerService["createAttributeDescription"]>[0],
  ) => {
    if (!this.authentication.current?.clientId) return;

    this.updateRequestStatus("createAttributeDescription", arg, "LOADING");
    const description =
      await this.workflowManagerService.createAttributeDescription(arg);

    if (description.success) {
      this.updateRequestStatus("createAttributeDescription", arg, "OK");
      this.upsertAttributeDescriptions(arg.workflowId, [description.data]);
    } else {
      this.updateRequestStatus("createAttributeDescription", arg, "ERROR");
    }
  };

  public setAttribute = async (
    arg: Parameters<WorkflowManagerService["setAttribute"]>[0],
  ) => {
    if (!this.authentication.current?.clientId) return;

    this.updateRequestStatus("setAttribute", arg, "LOADING");
    const attribute = await this.workflowManagerService.setAttribute(arg);

    if (attribute.success) {
      this.updateRequestStatus("setAttribute", arg, "OK");
      this.upsertAttributes(arg.refType, [attribute.data]);
    } else {
      this.updateRequestStatus("setAttribute", arg, "ERROR");
    }
  };

  public setWorkflowConfig = async (
    arg: Parameters<WorkflowManagerService["setWorkflowConfig"]>[0],
  ) => {
    if (!this.authentication.current?.clientId) return;

    this.updateRequestStatus("setWorkflowConfig", arg, "LOADING");
    const workflow = await this.workflowManagerService.setWorkflowConfig(arg);

    if (workflow.success) {
      this.updateRequestStatus("setWorkflowConfig", arg, "OK");
      this.upsertWorkflows([workflow.data]);
    } else {
      this.updateRequestStatus("setWorkflowConfig", arg, "ERROR");
    }
  };

  public setChangeRule = async (
    arg: Parameters<WorkflowManagerService["setChangeRule"]>[0],
  ) => {
    if (!this.authentication.current?.clientId) return;

    this.updateRequestStatus("setChangeRule", arg, "LOADING");
    const state = await this.workflowManagerService.setChangeRule(arg);

    if (state.success) {
      this.updateRequestStatus("setChangeRule", arg, "OK");
      this.upsertStates([state.data]);
    } else {
      this.updateRequestStatus("setChangeRule", arg, "ERROR");
    }
  };

  public moveState = async (
    arg: Parameters<WorkflowManagerService["moveState"]>[0],
  ) => {
    if (!this.authentication.current?.clientId) return;

    this.updateRequestStatus("moveState", arg, "LOADING");
    const res = await this.workflowManagerService.moveState(arg);

    if (res.success) {
      this.updateRequestStatus("moveState", arg, "OK");
      this.upsertEntities([res.data.entity]);
      this.upsertStates([res.data.from, res.data.to]);
    } else {
      this.updateRequestStatus("moveState", arg, "ERROR");
    }
  };

  public loadAttributeDescriptions = async (workflowId: number) => {
    if (!this.authentication.current?.clientId) return;

    this.updateRequestStatus(
      "loadAttributeDescriptions",
      workflowId,
      "LOADING",
    );
    const descriptions =
      await this.workflowManagerService.getAttributesDescription(workflowId);

    if (descriptions.success) {
      this.updateRequestStatus("loadAttributeDescriptions", workflowId, "OK");
      this.upsertAttributeDescriptions(workflowId, descriptions.data);
    } else {
      this.updateRequestStatus(
        "loadAttributeDescriptions",
        workflowId,
        "ERROR",
      );
    }
  };

  public loadAttributes = async (
    arg: Parameters<WorkflowManagerService["getAttributes"]>[0],
  ) => {
    if (!this.authentication.current?.clientId) return;

    this.minorSubscription(arg.baseEntityId, arg.refType);

    this.updateRequestStatus("loadAttributes", arg, "LOADING");
    const attrs = await this.workflowManagerService.getAttributes(arg);

    if (attrs.success) {
      this.updateRequestStatus("loadAttributes", arg, "OK");
      this.upsertAttributes(arg.refType, attrs.data);
    } else {
      this.updateRequestStatus("loadAttributes", arg, "ERROR");
    }
  };

  public loadWorkflow = async (workflowId: number) => {
    if (!this.authentication.current?.clientId) return;

    this.mainSubscription(workflowId);

    this.updateRequestStatus("loadWorkflow", workflowId, "LOADING");
    const res = await this.workflowManagerService.getWorkflow(workflowId);

    if (res.success) {
      this.updateRequestStatus("loadWorkflow", workflowId, "OK");
      this.upsertWorkflows([res.data]);
    } else {
      this.updateRequestStatus("loadWorkflow", workflowId, "ERROR");
    }
  };

  public loadWorkflows = async () => {
    if (!this.authentication.current?.clientId) return;

    this.mainSubscription();

    this.updateRequestStatus("loadWorkflows", undefined, "LOADING");
    const workflows = await this.workflowManagerService.listWorkflows();

    if (workflows.success) {
      this.updateRequestStatus("loadWorkflows", undefined, "OK");
      this.upsertWorkflows(workflows.data);
    } else {
      this.updateRequestStatus("loadWorkflows", undefined, "ERROR");
    }
  };

  public loadState = async (workflowStateId: number) => {
    if (!this.authentication.current?.clientId) return;

    this.updateRequestStatus("loadState", workflowStateId, "LOADING");
    const res = await this.workflowManagerService.getState(workflowStateId);

    if (res.success) {
      this.updateRequestStatus("loadState", workflowStateId, "OK");
      this.upsertStates([res.data]);
    } else {
      this.updateRequestStatus("loadState", workflowStateId, "ERROR");
    }
  };

  public loadStates = async (workflowId: number) => {
    if (!this.authentication.current?.clientId) return;

    this.updateRequestStatus("loadStates", workflowId, "LOADING");
    const res =
      await this.workflowManagerService.listStatesByWorkflow(workflowId);

    if (res.success) {
      this.updateRequestStatus("loadStates", workflowId, "OK");
      this.upsertStates(res.data);
    } else {
      this.updateRequestStatus("loadStates", workflowId, "ERROR");
    }
  };

  public loadEntity = async (entityId: number) => {
    if (!this.authentication.current?.clientId) return;

    this.updateRequestStatus("loadEntity", entityId, "LOADING");
    const res = await this.workflowManagerService.getEntity(entityId);

    if (res.success) {
      this.updateRequestStatus("loadEntity", entityId, "OK");
      this.upsertEntities([res.data]);
    } else {
      this.updateRequestStatus("loadEntity", entityId, "ERROR");
    }
  };

  public loadEntitiesByState = async (stateId: number) => {
    if (!this.authentication.current?.clientId) return;

    this.updateRequestStatus("loadEntitiesByState", stateId, "LOADING");
    const entities =
      await this.workflowManagerService.listEntitiesByState(stateId);

    if (entities.success) {
      this.updateRequestStatus("loadEntitiesByState", stateId, "OK");
      this.upsertEntities(entities.data);
    } else {
      this.updateRequestStatus("loadEntitiesByState", stateId, "ERROR");
    }
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

    // don't subscribe to too many topics
    // not good idea since user could have 5 states opened at the same time...
    // if (this.subscriptions.minor.length > 5)
    //   this.wsWorkflowManager.unsubscribe([this.subscriptions.minor.shift()!]);

    const sub: EntityReference = {
      baseEntityId,
      clientId: this.authentication.current.clientId,
      entitySubscriptionType: refType,
      attr: true,
    };
    this.wsWorkflowManager.subscribe([sub]);
    this.subscriptions.minor.push(sub);
  };

  /**
   * Order all objects so they match if key/values are the same independent of order
   */
  private static orderedEntries = (val: unknown) => {
    if (!Array.isArray(val) && val !== null && typeof val === "object") {
      return Object.entries(val)
        .sort(([key1, _val1], [key2, _val2]) => (key1 > key2 ? 1 : -1))
        .map(([key, val]) => [key, this.orderedEntries(val)]);
    }

    return val;
  };

  /**
   * Will infinite loop if payload references itself!
   */
  public static requestHash = <K extends keyof WorkflowStore["requestStatus"]>(
    payload: Parameters<WorkflowStore[K]>[0],
  ) => {
    return JSON.stringify(WorkflowStore.orderedEntries(payload));
  };

  private updateRequestStatus = <
    K extends keyof WorkflowStore["requestStatus"],
  >(
    request: K,
    payload: Parameters<WorkflowStore[K]>[0],
    status: RequestStatus,
  ) => {
    this.requestStatus[request].set(WorkflowStore.requestHash(payload), status);
  };

  private updateLocalStorageSession = () => {
    const sessions: string[] = [];

    for (const [sessionId, sessionIdx] of this.registeredSessions)
      sessions[sessionIdx] = sessionId;

    localStorage.setItem(REGISTERED_SESSIONS_KEY, sessions.join(";"));
  };

  private addSession = (sessionId: string) => {
    if (this.registeredSessions.has(sessionId)) return;

    this.registeredSessions.set(sessionId, this.registeredSessions.size);
    this.updateLocalStorageSession();
  };

  public removeSession = (sessionId: string) => {
    const sessionIdx = this.registeredSessions.get(sessionId);
    if (!sessionIdx) return;

    for (const [curSessionId, curSessionIdx] of [
      ...this.registeredSessions.entries(),
    ])
      if (curSessionIdx > sessionIdx)
        this.registeredSessions.set(curSessionId, curSessionIdx - 1);

    this.updateLocalStorageSession();
  };
}

class WorkflowManagerService {
  public createWorkflow = async (newWorkflow: RequestNewWorkflow) => {
    const resParser = parsers.WorkflowSchema;
    // not necessary but good practice since we might need to eventually transform
    // from domain to api format. So this function would always get the domain format
    const parsedNewWorkflow =
      parsers.RequestNewWorkflowSchema.parse(newWorkflow);

    try {
      const response = await this.client.POST("/workflows", {
        body: parsedNewWorkflow,
        headers: this.getHeaders(),
      });

      // @ts-ignore
      type _verify = Assert<
        Extends<
          (typeof response)["data"],
          z.input<typeof resParser> | undefined
        >
      >;

      const eventId = response.response.headers.get("event-id");
      if (eventId && this.seenEvents) this.seenEvents.add(eventId);

      return resParser.safeParse(response?.data);
    } catch {
      return { success: false } as {
        success: false;
        description?: undefined;
        error?: undefined;
      };
    }
  };

  public createState = async ({
    newState,
    workflowId,
  }: {
    newState: RequestNewWorkflowState;
    workflowId: number;
  }) => {
    const resParser = parsers.WorkflowStateSchema;
    const parsedNewState =
      parsers.RequestNewWorkflowStateSchema.parse(newState);

    try {
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
        Extends<
          (typeof response)["data"],
          z.input<typeof resParser> | undefined
        >
      >;

      const eventId = response.response.headers.get("event-id");
      if (eventId && this.seenEvents) this.seenEvents.add(eventId);

      return resParser.safeParse(response?.data);
    } catch {
      return { success: false } as {
        success: false;
        description?: undefined;
        error?: undefined;
      };
    }
  };

  public createEntity = async ({
    newEntity,
    workflowId,
  }: {
    newEntity: RequestNewWorkflowEntity;
    workflowId: number;
  }) => {
    const resParser = parsers.WorkflowEntitySchema;
    const parsedNewEntity =
      parsers.RequestNewWorkflowEntitySchema.parse(newEntity);

    try {
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
        Extends<
          (typeof response)["data"],
          z.input<typeof resParser> | undefined
        >
      >;

      const eventId = response.response.headers.get("event-id");
      if (eventId && this.seenEvents) this.seenEvents.add(eventId);

      return resParser.safeParse(response?.data);
    } catch {
      return { success: false } as {
        success: false;
        description?: undefined;
        error?: undefined;
      };
    }
  };

  public createAttributeDescription = async ({
    workflowId,
    ...body
  }: { workflowId: number } & z.infer<
    typeof parsers.RequestNewAttributeDescriptionSchema
  >) => {
    const resParser = parsers.WorkflowAttributeDescriptionSchema;
    try {
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
        Extends<
          (typeof response)["data"],
          z.input<typeof resParser> | undefined
        >
      >;

      const eventId = response.response.headers.get("event-id");
      if (eventId && this.seenEvents) this.seenEvents.add(eventId);

      return resParser.safeParse(response?.data);
    } catch {
      return { success: false } as {
        success: false;
        description?: undefined;
        error?: undefined;
      };
    }
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
    try {
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

      return resParser.safeParse(response?.data);
    } catch {
      return { success: false } as {
        success: false;
        description?: undefined;
        error?: undefined;
      };
    }
  };

  public setWorkflowConfig = async ({
    workflowId,
    config,
  }: {
    workflowId: number;
    config: RequestUpdateWorkflowConfig;
  }) => {
    const resParser = parsers.WorkflowSchema;
    try {
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
        Extends<
          (typeof response)["data"],
          z.input<typeof resParser> | undefined
        >
      >;

      const eventId = response.response.headers.get("event-id");
      if (eventId && this.seenEvents) this.seenEvents.add(eventId);

      return resParser.safeParse(response.data);
    } catch {
      return { success: false } as {
        success: false;
        description?: undefined;
        error?: undefined;
      };
    }
  };

  public setChangeRule = async ({
    workflowStateId,
    rule,
  }: {
    workflowStateId: number;
    rule: RequestSetChangeStateRule;
  }) => {
    const resParser = parsers.WorkflowStateSchema;
    try {
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
        Extends<
          (typeof response)["data"],
          z.input<typeof resParser> | undefined
        >
      >;

      const eventId = response.response.headers.get("event-id");
      if (eventId && this.seenEvents) this.seenEvents.add(eventId);

      return resParser.safeParse(response?.data);
    } catch {
      return { success: false } as {
        success: false;
        description?: undefined;
        error?: undefined;
      };
    }
  };

  public moveState = async ({
    entityId,
    newStateId,
  }: {
    entityId: number;
    newStateId: number;
  }) => {
    const resParser = parsers.ResponseEntityChangeStateSchema;
    try {
      const response = await this.client.PATCH(
        "/workflow-entities/{entityId}/workflow-states/{newStateId}",
        {
          params: { path: { entityId, newStateId } },
          headers: this.getHeaders(),
        },
      );

      // @ts-ignore
      type _verify = Assert<
        Extends<
          (typeof response)["data"],
          z.input<typeof resParser> | undefined
        >
      >;

      const eventId = response.response.headers.get("event-id");
      if (eventId && this.seenEvents) this.seenEvents.add(eventId);

      return resParser.safeParse(response?.data);
    } catch {
      return { success: false } as {
        success: false;
        description?: undefined;
        error?: undefined;
      };
    }
  };

  public listWorkflows = async () => {
    const resParser = parsers.WorkflowSchema.array();
    try {
      const response = await this.client.GET("/workflows", {
        headers: this.getHeaders(),
      });

      // @ts-ignore
      type _verify = Assert<
        Extends<
          (typeof response)["data"],
          z.input<typeof resParser> | undefined
        >
      >;

      return resParser.safeParse(response?.data);
    } catch {
      return { success: false } as {
        success: false;
        description?: undefined;
        error?: undefined;
      };
    }
  };

  public listStatesByWorkflow = async (workflowId: number) => {
    const resParser = parsers.WorkflowStateSchema.array();
    try {
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
        Extends<
          (typeof response)["data"],
          z.input<typeof resParser> | undefined
        >
      >;

      const x = resParser.parse(response?.data);
      return resParser.safeParse(response?.data);
    } catch (e) {
      return { success: false } as {
        success: false;
        description?: undefined;
        error?: undefined;
      };
    }
  };

  public listEntitiesByState = async (workflowStateId: number) => {
    const resParser = parsers.WorkflowEntitySchema.array();
    try {
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
        Extends<
          (typeof response)["data"],
          z.input<typeof resParser> | undefined
        >
      >;

      return resParser.safeParse(response?.data);
    } catch {
      return { success: false } as {
        success: false;
        description?: undefined;
        error?: undefined;
      };
    }
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
    try {
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

      return resParser.safeParse(response?.data);
    } catch {
      return { success: false } as {
        success: false;
        description?: undefined;
        error?: undefined;
      };
    }
  };

  public getAttributesDescription = async (workflowId: number) => {
    const resParser = parsers.WorkflowAttributeDescriptionSchema.array();
    try {
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
        Extends<
          (typeof response)["data"],
          z.input<typeof resParser> | undefined
        >
      >;

      return resParser.safeParse(response?.data);
    } catch {
      return { success: false } as {
        success: false;
        description?: undefined;
        error?: undefined;
      };
    }
  };

  public getWorkflow = async (workflowId: number) => {
    const resParser = parsers.WorkflowSchema;
    try {
      const response = await this.client.GET("/workflows/{workflowId}", {
        params: {
          path: { workflowId },
        },
        headers: this.getHeaders(),
      });

      // @ts-ignore
      type _verify = Assert<
        Extends<
          (typeof response)["data"],
          z.input<typeof resParser> | undefined
        >
      >;

      return resParser.safeParse(response?.data);
    } catch {
      return { success: false } as {
        success: false;
        description?: undefined;
        error?: undefined;
      };
    }
  };

  public getState = async (workflowStateId: number) => {
    const resParser = parsers.WorkflowStateSchema;
    try {
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
        Extends<
          (typeof response)["data"],
          z.input<typeof resParser> | undefined
        >
      >;

      return resParser.safeParse(response?.data);
    } catch {
      return { success: false } as {
        success: false;
        description?: undefined;
        error?: undefined;
      };
    }
  };

  public getEntity = async (workflowEntityId: number) => {
    const resParser = parsers.WorkflowEntitySchema;
    try {
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
        Extends<
          (typeof response)["data"],
          z.input<typeof resParser> | undefined
        >
      >;

      return resParser.safeParse(response?.data);
    } catch {
      return { success: false } as {
        success: false;
        description?: undefined;
        error?: undefined;
      };
    }
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
    creationTime: DayjsTimeSchema,
    updateTime: DayjsTimeSchema,
    deletionTime: DayjsTimeSchema.nullish().transform(standardUndefined),
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
    creationTime: DayjsTimeSchema,
    updateTime: DayjsTimeSchema,
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
    creationTime: DayjsTimeSchema,
    updateTime: DayjsTimeSchema,
    integer: IntegerSchema.nullish().transform(standardUndefined),
    floating: z.number().nullish().transform(standardUndefined),
    enumeration: z.string().nullish().transform(standardUndefined),
    decimal: DecimalSchema.nullish().transform(standardUndefined),
    date: DayjsDateSchema.nullish().transform(standardUndefined),
    timestamp: DayjsTimeSchema.nullish().transform(standardUndefined),
    flag: z.boolean().nullish().transform(standardUndefined),
    text: z.string().nullish().transform(standardUndefined),
  });

  export const RequestSetChangeStateRuleSchema = z.object({
    toId: z.number(),
    expressionNames: z.string().array().min(1),
    expressions: z.string().array().min(1),
  });

  export const ChangeStateRulesSchema = z.object({
    fromId: z.number(),
    toId: z.number(),
    expressionNames: z.string().array(),
    expressions: z.string().array(),
    creationTime: DayjsTimeSchema,
    updateTime: DayjsTimeSchema,
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
    date: DayjsDateSchemaRev.optional(),
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
    lastCurrentEntitiesChange: DayjsTimeSchema,
  });
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
