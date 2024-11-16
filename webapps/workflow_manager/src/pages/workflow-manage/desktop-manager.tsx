import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { AttributesForm } from "./attributes-form";
import { NewEntityForm } from "./new-entity-form";
import { Skeleton } from "@/components/ui/skeleton";
import { SetConfigForm } from "./set-config-form";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/context";
import { WorkflowStore } from "@/store/workflow-store";
import { AttributeDescriptionManager } from "./attribute-description-form";
import {
  Workflow,
  WorkflowEntity,
  WorkflowState,
} from "@/store/workflow-store";
import { CubeIcon, GearIcon } from "@radix-ui/react-icons";
import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { ChangeStateRulesForm } from "./change-state-rules-form";
import { StateChangeOptions } from "./state-change-options";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewStateForm } from "./new-state-form";
import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";

type DialogContextBaseEntity = {
  type: "ATTRIBUTE";
} & Parameters<typeof AttributesForm>[0];
type DialogContentNewEntity = {
  type: "NEW_ENTITY";
} & Parameters<typeof NewEntityForm>[0];
type DialogContext = DialogContextBaseEntity | DialogContentNewEntity;

const contextTypeGuard = (ctx: DialogContext): ctx is DialogContextBaseEntity =>
  ctx.type === "ATTRIBUTE";

class PageStore {
  public dialogContext: { current?: DialogContext } = {};

  public clearCtxNoPop = () => (this.dialogContext.current = undefined);

  public setCtx = (ctx?: DialogContext) => {
    if (ctx) {
      if (!this.dialogContext.current) history.pushState(undefined, "");
      this.dialogContext.current = ctx;
    } else {
      if (this.dialogContext.current) history.back();
      this.dialogContext.current = undefined;
    }
  };

  public setCtxEntity = (entity: WorkflowEntity) =>
    this.setCtx({
      type: "ATTRIBUTE",
      workflowId: entity.workflowId,
      refType: "WORKFLOW_ENTITY",
      baseEntityId: entity.id,
    });
  public setCtxState = (state: WorkflowState) =>
    this.setCtx({
      type: "ATTRIBUTE",
      workflowId: state.workflowId,
      refType: "WORKFLOW_STATE",
      baseEntityId: state.id,
    });
  public setCtxWorkflow = (workflow: Workflow) =>
    this.setCtx({
      type: "ATTRIBUTE",
      workflowId: workflow.id,
      refType: "WORKFLOW",
      baseEntityId: workflow.id,
    });
  public setCtxNewEntity = (workflowId: number) =>
    this.setCtx({
      workflowId,
      type: "NEW_ENTITY",
    });

  public constructor() {
    makeAutoObservable(this);
  }
}

const usePageStore = () => React.useState(new PageStore())[0];

const PageContext = React.createContext<PageStore>(
  null as unknown as PageStore,
);

export const DesktopManager = observer(
  ({ workflowId }: { workflowId: number }) => {
    const pageStore = usePageStore();
    // history/modal management
    React.useEffect(() => {
      const closeModal = () => {
        if (pageStore.dialogContext.current) pageStore.clearCtxNoPop();
      };

      window.addEventListener("popstate", closeModal);

      return () => window.removeEventListener("popstate", closeModal);
    }, [pageStore]);

    // handle escape
    React.useEffect(() => {
      const closeModal = (event: KeyboardEvent) => {
        if (event.key === "Escape") pageStore.setCtx();
      };
      window.addEventListener("keydown", closeModal);

      return () => window.removeEventListener("keydown", closeModal);
    }, [pageStore]);

    return (
      <PageContext.Provider value={pageStore}>
        <Dialog open={!!pageStore.dialogContext.current}>
          <div className="hidden md:block">
            <div className="flex flex-col gap-4">
              <WorkflowTitle workflowId={workflowId} />
              <div className="w-4/5 mx-auto">
                <StateCollapserList workflowId={workflowId} />
              </div>
            </div>
            <PageDialogContent />
          </div>
        </Dialog>
      </PageContext.Provider>
    );
  },
);

const WorkflowTitle = observer(({ workflowId }: { workflowId: number }) => {
  const workflowStore = useWorkflowStore();
  const pageStore = React.useContext(PageContext);

  const workflow = workflowStore.workflows.get(workflowId);

  return (
    <div className="h-20 border-b flex justify-between px-32 relative">
      <Link to="/workflows" className="absolute top-5 left-12">
        <Button>
          <ArrowLeftIcon />
        </Button>
      </Link>
      <h1 className="font-extrabold text-5xl font-mono my-auto">
        {workflow?.name}
      </h1>
      <div className="my-auto">
        <Button
          variant="outline"
          disabled={!workflow}
          onClick={() => {
            if (workflow) pageStore.setCtxWorkflow(workflow);
          }}
        >
          <GearIcon />
        </Button>
      </div>
    </div>
  );
});

const StateCollapserList = observer(
  ({ workflowId }: { workflowId: number }) => {
    const workflowStore = useWorkflowStore();
    const workflow = workflowStore.workflows.get(workflowId);

    return (
      <div className="flex flex-col gap-4 mb-4">
        {[...workflowStore.workflowStates.values()]
          .filter((state) => state.workflowId === workflowId)
          .sort((a, b) => a.id - b.id)
          .map((state) => (
            <StateCollapser
              state={state}
              key={state.id}
              isStarting={workflow?.initialStateId === state.id}
            />
          ))}
      </div>
    );
  },
);

const StateCollapser = observer(
  ({ state, isStarting }: { state: WorkflowState; isStarting?: boolean }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const workflowStore = useWorkflowStore();
    const pageStore = React.useContext(PageContext);
    const dialogCtx = pageStore.dialogContext.current;

    if (
      dialogCtx &&
      dialogCtx.type === "ATTRIBUTE" &&
      dialogCtx.refType === "WORKFLOW_ENTITY"
    ) {
      const entity = workflowStore.workflowEntities.get(dialogCtx.baseEntityId);

      if (entity?.currentStateId === state.id && !isOpen) setIsOpen(true);
    }

    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div
            className={cn(
              "flex justify-between w-full rounded-md px-4 py-2 hover:bg-accent",
              {
                "rounded-xl border": !isOpen,
                "rounded-t-xl border-l border-r border-t": isOpen,
              },
            )}
          >
            <h2 className="text-xl font-bold font-mono">{state.name}</h2>
            <div className="flex justify-end gap-4">
              {isStarting ? (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    pageStore.setCtxNewEntity(state.workflowId);
                  }}
                  className="font-mono"
                  variant="outline"
                >
                  New entity
                </Button>
              ) : null}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  pageStore.setCtxState(state);
                }}
                variant="outline"
              >
                <GearIcon className="my-auto" />
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <EntityList stateId={state.id} />
        </CollapsibleContent>
      </Collapsible>
    );
  },
);

const EntityList = observer(({ stateId }: { stateId: number }) => {
  const workflowStore = useWorkflowStore();

  React.useEffect(() => {
    void workflowStore.loadState(stateId);
    void workflowStore.loadEntitiesByState(stateId);
  }, [workflowStore]);

  const entities = [
    ...(workflowStore.workflowEntitiesByState.get(stateId)?.values() ?? []),
  ];

  const entitiesByStateStatus =
    workflowStore.requestStatus.loadEntitiesByState.get(
      WorkflowStore.requestHash(stateId),
    );

  return (
    <div className="border rounded-b-xl flex flex-col">
      {entities.map((entity, idx) => (
        <EntityEntry
          key={entity.id}
          entity={entity}
          isLast={
            idx === entities.length - 1 && entitiesByStateStatus === "LOADING"
          }
        />
      ))}
      {entities.length === 0 && entitiesByStateStatus === "OK" ? (
        <div className="h-36 w-full flex justify-center">
          <div className="flex flex-col my-auto gap-2">
            <CubeIcon className="h-20 w-20 mx-auto" />
            <p className="text-center font-mono">No entities</p>
          </div>
        </div>
      ) : null}
      {entitiesByStateStatus === "ERROR" ? (
        <div className="h-36 w-full flex justify-center text-destructive">
          <div className="flex flex-col my-auto gap-2">
            <CubeIcon className="h-20 w-20 mx-auto" />
            <p className="text-center font-mono">ERROR</p>
          </div>
        </div>
      ) : null}
      {entitiesByStateStatus === "LOADING" && entities.length === 0
        ? Array.from({ length: 3 }).map((_, idx) => (
            <EntityEntry key={idx} isLast={idx === 2} skeleton />
          ))
        : null}
      {entitiesByStateStatus === "LOADING" && entities.length > 0 ? (
        <EntityEntry isLast skeleton />
      ) : null}
    </div>
  );
});

const EntityEntry = ({
  entity,
  isLast,
  skeleton,
}:
  | {
      entity: WorkflowEntity;
      isLast?: boolean;
      skeleton?: false;
    }
  | {
      entity?: undefined;
      isLast?: boolean;
      skeleton: true;
    }) => {
  const pageStore = React.useContext(PageContext);

  return (
    <div
      className={cn(
        "w-full border hover:bg-accent text-mono text-xl pl-8 py-2",
        {
          "rounded-b-xl": isLast,
          "p-0": skeleton,
        },
      )}
      onClick={() => {
        if (entity) {
          pageStore.setCtxEntity(entity);
        }
      }}
    >
      {skeleton ? <Skeleton className="h-10" /> : entity.name}
    </div>
  );
};

const PageDialogContent = observer(() => {
  const pageStore = React.useContext(PageContext);

  const unresolvedCtx = pageStore.dialogContext.current;
  const [attrCtx, newEntityCtx] = unresolvedCtx
    ? contextTypeGuard(unresolvedCtx)
      ? [unresolvedCtx, undefined]
      : [undefined, unresolvedCtx]
    : [undefined, undefined];

  return (
    <>
      <DialogContent
        className={cn({
          "max-w-[900px] h-[90vh]": !!attrCtx,
        })}
        onCloseClicked={() => pageStore.setCtx()}
      >
        {attrCtx ? <AttributeContext attrCtx={attrCtx} /> : null}
        {newEntityCtx ? <NewEntityContext newEntityCtx={newEntityCtx} /> : null}
      </DialogContent>
    </>
  );
});

const AttributeContext = observer(
  ({ attrCtx }: { attrCtx: DialogContextBaseEntity }) => {
    return (
      <>
        {attrCtx.refType === "WORKFLOW" ? (
          <WorkflowContext ctx={attrCtx} />
        ) : null}
        {attrCtx.refType === "WORKFLOW_STATE" ? (
          <StateContext ctx={attrCtx} />
        ) : null}
        {attrCtx.refType === "WORKFLOW_ENTITY" ? (
          <EntityContext ctx={attrCtx} />
        ) : null}
      </>
    );
  },
);

const WorkflowContext = observer(
  ({ ctx }: { ctx: Parameters<typeof AttributesForm>[0] }) => {
    const workflowStore = useWorkflowStore();

    const workflowName = workflowStore.workflows.get(ctx.workflowId)?.name;

    return (
      <Tabs defaultValue="attributes">
        <div className="max-w-[850px] h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {workflowName ? `Workflow: ${workflowName}` : ""}
            </DialogTitle>
            <DialogDescription>Manage the workflow.</DialogDescription>
            <TabsList className="flex justify-start wrap">
              <TabsTrigger value="attributes">
                Set Workflow Attributes
              </TabsTrigger>
              <TabsTrigger value="configure">Configure Workflow</TabsTrigger>
              <TabsTrigger value="addStates">Add states</TabsTrigger>
              <TabsTrigger value="attributeDescriptions">
                Configure Attributes
              </TabsTrigger>
            </TabsList>
          </DialogHeader>
          <div className="mt-12">
            <TabsContent className="font-mono" value="attributes">
              <AttributesForm {...ctx} />
            </TabsContent>
            <TabsContent className="font-mono" value="addStates">
              <NewStateForm {...ctx} />
            </TabsContent>
            <TabsContent className="font-mono" value="configure">
              <SetConfigForm workflowId={ctx.workflowId} />
            </TabsContent>
            <TabsContent className="font-mono" value="attributeDescriptions">
              <AttributeDescriptionManager workflowId={ctx.workflowId} />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    );
  },
);

const StateContext = observer(
  ({ ctx }: { ctx: Parameters<typeof AttributesForm>[0] }) => {
    const workflowStore = useWorkflowStore();

    const stateName = workflowStore.workflowStates.get(ctx.baseEntityId)?.name;

    return (
      <Tabs defaultValue="attributes">
        <div className="max-w-[850px] h-[90vh]">
          <DialogHeader>
            <DialogTitle>{stateName ? `State: ${stateName}` : ""}</DialogTitle>
            <DialogDescription>Manage this state.</DialogDescription>
            <TabsList className="flex justify-start wrap">
              <TabsTrigger value="attributes">Set State Attributes</TabsTrigger>
              <TabsTrigger value="rules">Configure Move Rules</TabsTrigger>
            </TabsList>
          </DialogHeader>
          <div className="mt-12">
            <TabsContent className="font-mono" value="attributes">
              <AttributesForm {...ctx} />
            </TabsContent>
            <TabsContent className="font-mono" value="rules">
              <ChangeStateRulesForm
                workflowId={ctx.workflowId}
                stateId={ctx.baseEntityId}
              />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    );
  },
);

const EntityContext = observer(
  ({ ctx }: { ctx: Parameters<typeof AttributesForm>[0] }) => {
    const workflowStore = useWorkflowStore();

    const entity = workflowStore.workflowEntities.get(ctx.baseEntityId);
    const curState = entity
      ? workflowStore.workflowStates.get(entity.currentStateId)
      : undefined;

    return (
      <Tabs defaultValue="attributes">
        <div className="max-w-[850px] h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {entity && curState
                ? `Entity: ${entity.name} - Current state ${curState.name}`
                : ""}
            </DialogTitle>
            <DialogDescription>Manage this entity.</DialogDescription>
            <TabsList className="flex justify-start wrap">
              <TabsTrigger value="attributes">
                Set Entity Attributes
              </TabsTrigger>
              <TabsTrigger value="moveState">
                Move entity to another state
              </TabsTrigger>
            </TabsList>
          </DialogHeader>
          <div className="mt-12">
            <TabsContent className="font-mono" value="attributes">
              <AttributesForm {...ctx} />
            </TabsContent>
            <TabsContent className="font-mono" value="moveState">
              <StateChangeOptions
                workflowId={ctx.workflowId}
                entityId={ctx.baseEntityId}
              />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    );
  },
);

const NewEntityContext = observer(
  ({ newEntityCtx }: { newEntityCtx: DialogContentNewEntity }) => {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Create a new entity</DialogTitle>
          <DialogDescription>
            Fill in the information to create a new entity. It&apos;ll start in
            the state set in workflow configuration.
          </DialogDescription>
        </DialogHeader>
        <NewEntityForm {...newEntityCtx} />
      </>
    );
  },
);
