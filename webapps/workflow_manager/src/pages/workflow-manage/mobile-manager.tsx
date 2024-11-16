import { AttributesForm } from "./attributes-form";
import { NewEntityForm } from "./new-entity-form";
import { Skeleton } from "@/components/ui/skeleton";
import { SetConfigForm } from "./set-config-form";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/context";
import { WorkflowStore } from "@/store/workflow-store";
import { AttributeDescriptionManager } from "./attribute-description-form";
import { GearIcon } from "@radix-ui/react-icons";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardTitle } from "@/components/ui/card";
import { NewStateForm } from "./new-state-form";
import { SwipeEventData, useSwipeable } from "react-swipeable";

type MobileManagerView =
  | "WORKFLOW_STATES"
  | "WORKFLOW_ATTRS"
  | "WORKFLOW_CONFIG"
  | "ADD_STATES"
  | "ATTR_DESCRIPTIONS"
  | "STATE_ENTITIES"
  | "STATE_ATTRS"
  | "STATE_RULES"
  | "ENTITY_ATTRS"
  | "ENTITY_MOVE";

class MobileManagerStore {
  public ctx: MobileWorkflowContextType;
  private workflowStore: WorkflowStore;

  public get nextState() {
    if (!this.ctx?.selectedStateId && this.ctx.selectedStateId !== 0) return;

    const curStateIdx = this.statesOrdered.findIndex(
      (state) => state.id === this.ctx.selectedStateId,
    );

    return this.statesOrdered.at(curStateIdx + 1);
  }

  public get statesOrdered() {
    return [
      ...(this.workflowStore.workflowStatesByWorkflow
        .get(this.ctx.workflowId)
        ?.values() ?? []),
    ].sort((a, b) => a.id - b.id);
  }

  public get entitiesOrdered() {
    return typeof this.ctx.selectedStateId === "number"
      ? [
          ...(this.workflowStore.workflowEntitiesByState
            .get(this.ctx.selectedStateId)
            ?.values() ?? []),
        ].sort((a, b) => a.id - b.id)
      : [];
  }

  public selectState = (stateId?: number, dontChangeView?: boolean) => {
    this.ctx.selectedStateId = stateId;
    if (!dontChangeView) this.ctx.currentView = "STATE_ENTITIES";

    // state updated but entity's current state doesn't match
    const entity = this.ctx.selectedEntityId
      ? this.workflowStore.workflowEntities.get(this.ctx.selectedEntityId)
      : undefined;
    if (entity && entity.currentStateId !== this.ctx.selectedStateId) {
      this.ctx.currentView = "STATE_ENTITIES";
      this.ctx.selectedEntityId = undefined;
    }
  };

  public selectEntity = (entityId?: number) => {
    this.ctx.selectedEntityId = entityId;
    this.ctx.currentView = "ENTITY_ATTRS";
  };

  public setCurrentView = (view: MobileManagerView) =>
    (this.ctx.currentView = view);

  public constructor(
    ctx: MobileWorkflowContextType,
    workflowStore: WorkflowStore,
  ) {
    this.ctx = ctx;
    this.workflowStore = workflowStore;

    makeAutoObservable(this);
  }
}

type MobileWorkflowContextType = {
  workflowId: number;
  selectedStateId?: number;
  selectedEntityId?: number;
  currentView: MobileManagerView;
};

const MobileWorkflowContext = React.createContext<MobileManagerStore>(
  null as unknown as MobileManagerStore,
);

const useMobileStore = () => React.useContext(MobileWorkflowContext);

export const MobileWorkflowManager = ({
  workflowId,
}: {
  workflowId: number;
}) => {
  const workflowStore = useWorkflowStore();
  const mobileStore = React.useState(
    new MobileManagerStore(
      { workflowId, currentView: "WORKFLOW_STATES" },
      workflowStore,
    ),
  )[0];

  return (
    <MobileWorkflowContext.Provider value={mobileStore}>
      <div className="h-[100vh] flex flex-col md:hidden">
        <WorkflowView />
        <StateView />
        <EntityView />
      </div>
    </MobileWorkflowContext.Provider>
  );
};

const getNextFromSwipeHOF = (
  mobileStore: MobileManagerStore,
  arr: readonly MobileManagerView[],
) => {
  return (swipeEvent: SwipeEventData) => {
    const cur = mobileStore.ctx.currentView;

    let idx = arr.findIndex((val) => val === cur);
    if (idx === -1) idx = 0;

    let newView: MobileManagerView;
    if (swipeEvent.dir === "Left" && swipeEvent.absX > 50)
      newView = arr[Math.min(idx + 1, arr.length - 1)] ?? cur;
    else if (swipeEvent.dir === "Right" && swipeEvent.absX > 50)
      newView = arr[Math.max(idx - 1, 0)] ?? cur;
    else newView = cur;

    if (newView !== cur) mobileStore.setCurrentView(newView);
  };
};

const WORKFLOW_VIEW_EXPANDED = [
  "WORKFLOW_STATES",
  "WORKFLOW_ATTRS",
  "WORKFLOW_CONFIG",
  "ADD_STATES",
  "ATTR_DESCRIPTIONS",
] as const satisfies readonly MobileManagerView[];
type WorkflowViewExpanded = (typeof WORKFLOW_VIEW_EXPANDED)[number];
const isWorklfowViewExpanded = (
  view: MobileManagerView,
): view is WorkflowViewExpanded =>
  WORKFLOW_VIEW_EXPANDED.includes(view as WorkflowViewExpanded);
const WorkflowView = observer(() => {
  return (
    <>
      <WorkflowViewTitle />
      <WorkflowViewContent />
    </>
  );
});
const WorkflowViewTitle = observer(() => {
  const workflowStore = useWorkflowStore();
  const mobileStore = useMobileStore();

  const isExpanded = isWorklfowViewExpanded(mobileStore.ctx.currentView);
  const workflow = workflowStore.workflows.get(mobileStore.ctx.workflowId);

  return (
    <div
      className="border-y-2 border-accent"
      onClick={() => mobileStore.setCurrentView("WORKFLOW_STATES")}
    >
      {workflow ? (
        <>
          <span className="absolute text-5xl left-0 font-mono top-1">W</span>
          <h2
            className={cn("text-3xl font-bold text-center mx-16 py-1", {
              "line-clamp-1": !isExpanded,
              "line-clamp-2": isExpanded,
            })}
          >
            {workflow.name}
          </h2>
          <Button
            className="absolute right-2 font-mono top-2"
            onClick={(e) => {
              e.stopPropagation();
              mobileStore.setCurrentView("WORKFLOW_ATTRS");
            }}
            icon={<GearIcon />}
          />
        </>
      ) : (
        <Skeleton />
      )}
    </div>
  );
});
const WorkflowViewContent = observer(() => {
  const mobileStore = useMobileStore();

  const view = mobileStore.ctx.currentView;
  const isExpanded = isWorklfowViewExpanded(view);

  const swipeHandlers = useSwipeable({
    onSwiped: getNextFromSwipeHOF(mobileStore, WORKFLOW_VIEW_EXPANDED),
  });

  return (
    <div
      {...swipeHandlers}
      className={cn("h-full transition-all duration-150 overflow-y-auto", {
        "scale-y-0 hidden": !isExpanded,
      })}
    >
      {isExpanded ? (
        view === "WORKFLOW_STATES" ? (
          <WorkflowStatesView />
        ) : (
          <Tabs
            value={view}
            onValueChange={(v) =>
              mobileStore.setCurrentView(v as MobileManagerView)
            }
          >
            <TabsList className="w-full flex flex-wrap justify-center h-fit">
              <TabsTrigger value="WORKFLOW_ATTRS">
                Workflow attributes
              </TabsTrigger>
              <TabsTrigger value="WORKFLOW_CONFIG">Workflow config</TabsTrigger>
              <TabsTrigger value="ADD_STATES">Add states</TabsTrigger>
              <TabsTrigger value="ATTR_DESCRIPTIONS">
                Configure attributes
              </TabsTrigger>
            </TabsList>
            <div className="p-4">
              <TabsContent value="WORKFLOW_ATTRS">
                <WorkflowAttrsView />
              </TabsContent>
              <TabsContent value="WORKFLOW_CONFIG">
                <WorkflowConfigView />
              </TabsContent>
              <TabsContent value="ADD_STATES">
                <AddStatesView />
              </TabsContent>
              <TabsContent value="ATTR_DESCRIPTIONS">
                <AttrsDescriptionView />
              </TabsContent>
            </div>
          </Tabs>
        )
      ) : null}
    </div>
  );
});
const WorkflowStatesView = observer(() => {
  const mobileStore = useMobileStore();

  return (
    <div className="flex flex-col gap-4 mt-4 pb-8">
      <div className="flex justify-between mx-4">
        <h3 className="text-xl font-bold">States</h3>
        <NewEntityButton />
      </div>
      {mobileStore.statesOrdered.map((state) => (
        <Card
          key={state.id}
          onClick={() => mobileStore.selectState(state.id)}
          className="w-96 h-32 mx-auto max-w-[80vw] text-accent-foreground rounded-3xl flex flex-col justify-between hover:bg-accent"
        >
          <CardTitle className="text-2xl line-clamp-1 px-4 pt-4 font-semibold font-mono">
            {state.name}
          </CardTitle>
        </Card>
      ))}
    </div>
  );
});
const NewEntityButton = () => {
  const mobileStore = useMobileStore();
  const workflowStore = useWorkflowStore();

  const workflow = workflowStore.workflows.get(mobileStore.ctx.workflowId);
  const initialStateName =
    typeof workflow?.initialStateId === "number"
      ? workflowStore.workflowStates.get(workflow.initialStateId)?.name
      : undefined;

  return typeof workflow?.initialStateId === "number" ? (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          disabled={typeof workflow.initialStateId !== "number"}
          variant="outline"
        >
          New entity
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create entity</DialogTitle>
          <DialogDescription>
            Submit form to create a new entity. Entity will be created in state{" "}
            <span className="font-extrabold underline">
              {initialStateName ?? ""}
            </span>
          </DialogDescription>
        </DialogHeader>
        <NewEntityForm workflowId={mobileStore.ctx.workflowId} inDialog />
      </DialogContent>
    </Dialog>
  ) : null;
};
const WorkflowAttrsView = observer(() => {
  const mobileStore = useMobileStore();
  const workflowId = mobileStore.ctx.workflowId;

  return (
    <AttributesForm
      workflowId={workflowId}
      refType="WORKFLOW"
      baseEntityId={workflowId}
    />
  );
});
const WorkflowConfigView = observer(() => {
  const mobileStore = useMobileStore();
  const workflowId = mobileStore.ctx.workflowId;

  return <SetConfigForm workflowId={workflowId} />;
});
const AddStatesView = observer(() => {
  const mobileStore = useMobileStore();
  const workflowId = mobileStore.ctx.workflowId;

  return <NewStateForm workflowId={workflowId} />;
});
const AttrsDescriptionView = observer(() => {
  const mobileStore = useMobileStore();
  const workflowId = mobileStore.ctx.workflowId;

  return <AttributeDescriptionManager workflowId={workflowId} />;
});

const STATE_VIEW_EXPANDED = [
  "STATE_ENTITIES",
  "STATE_ATTRS",
  "STATE_RULES",
] as const satisfies readonly MobileManagerView[];
type StateViewExpanded = (typeof STATE_VIEW_EXPANDED)[number];
const isStateViewExpanded = (
  view: MobileManagerView,
): view is StateViewExpanded =>
  STATE_VIEW_EXPANDED.includes(view as StateViewExpanded);
const StateView = observer(() => {
  const workflowStore = useWorkflowStore();
  const mobileStore = useMobileStore();

  const selectedStateId = mobileStore.ctx.selectedStateId;

  React.useEffect(() => {
    if (typeof selectedStateId === "number") {
      void workflowStore.loadState(selectedStateId);
      void workflowStore.loadEntitiesByState(selectedStateId);
    }
  }, [workflowStore, selectedStateId]);

  return (
    <>
      <StateViewTitle />
      <StateViewContent />
    </>
  );
});
const StateViewTitle = observer(() => {
  const workflowStore = useWorkflowStore();
  const mobileStore = useMobileStore();

  const isExpanded = isStateViewExpanded(mobileStore.ctx.currentView);
  const state =
    typeof mobileStore.ctx.selectedStateId === "number"
      ? workflowStore.workflowStates.get(mobileStore.ctx.selectedStateId)
      : undefined;

  return state ? (
    <div
      className="border-y-2 pb-2 border-accent relative"
      onClick={() => mobileStore.setCurrentView("STATE_ENTITIES")}
    >
      <span className="absolute text-5xl left-0 font-mono top-1">S</span>
      <h2
        className={cn("text-3xl font-bold text-center mx-16 py-1", {
          "line-clamp-1": !isExpanded,
          "line-clamp-2": isExpanded,
        })}
      >
        {state?.name}
      </h2>
      <Button
        className="absolute right-2 font-mono top-2"
        onClick={(e) => {
          e.stopPropagation();
          mobileStore.setCurrentView("STATE_ATTRS");
        }}
        icon={<GearIcon />}
      />
    </div>
  ) : null;
});
const StateViewContent = observer(() => {
  const mobileStore = useMobileStore();

  const view = mobileStore.ctx.currentView;
  const isExpanded = isStateViewExpanded(view);

  const swipeHandlers = useSwipeable({
    onSwiped: getNextFromSwipeHOF(mobileStore, STATE_VIEW_EXPANDED),
  });

  return (
    <div
      {...swipeHandlers}
      className={cn("h-full transition-all duration-150 overflow-y-auto", {
        "scale-y-0 hidden": !isExpanded,
      })}
    >
      {isExpanded ? (
        view === "STATE_ENTITIES" ? (
          <StateEntitiesView />
        ) : (
          <Tabs
            value={view}
            onValueChange={(v) =>
              mobileStore.setCurrentView(v as MobileManagerView)
            }
          >
            <TabsList className="w-full flex justify-center p-2">
              <TabsTrigger value="STATE_ATTRS">State attributes</TabsTrigger>
              <TabsTrigger value="STATE_RULES">State change rules</TabsTrigger>
            </TabsList>
            <div className="p-4">
              <TabsContent value="STATE_ATTRS">
                <StateAttrsView />
              </TabsContent>
              <TabsContent value="STATE_RULES">
                <StateRulesView />
              </TabsContent>
            </div>
          </Tabs>
        )
      ) : null}
    </div>
  );
});
const StateEntitiesView = observer(() => {
  const mobileStore = useMobileStore();

  return (
    <div className="flex flex-col gap-4 mt-4 pb-8">
      <h3 className="text-xl ml-4">Entities</h3>
      {mobileStore.entitiesOrdered.map((entity) => (
        <Card
          key={entity.id}
          className="w-96 h-32 mx-auto max-w-[80vw] text-accent-foreground rounded-3xl flex flex-col justify-between hover:bg-accent"
          onClick={() => mobileStore.selectEntity(entity.id)}
        >
          <CardTitle className="text-2xl line-clamp-1 px-4 pt-4 font-semibold font-mono">
            {entity.name}
          </CardTitle>
        </Card>
      ))}
    </div>
  );
});
const StateAttrsView = observer(() => {
  const mobileStore = useMobileStore();
  const workflowId = mobileStore.ctx.workflowId;
  const stateId = mobileStore.ctx.selectedStateId;

  return (
    <div className="flex flex-col gap-4">
      {stateId ? (
        <AttributesForm
          workflowId={workflowId}
          refType="WORKFLOW_STATE"
          baseEntityId={stateId}
        />
      ) : null}
    </div>
  );
});
const StateRulesView = observer(() => {
  const mobileStore = useMobileStore();
  const workflowId = mobileStore.ctx.workflowId;
  const stateId = mobileStore.ctx.selectedStateId;

  return (
    <div className="flex flex-col gap-4">
      {stateId ? (
        <ChangeStateRulesForm workflowId={workflowId} stateId={stateId} />
      ) : null}
    </div>
  );
});

const ENTITY_VIEW_EXPANDED = [
  "ENTITY_ATTRS",
  "ENTITY_MOVE",
] as const satisfies readonly MobileManagerView[];
type EntityViewExpanded = (typeof ENTITY_VIEW_EXPANDED)[number];
const isEntityViewExpanded = (
  view: MobileManagerView,
): view is EntityViewExpanded =>
  ENTITY_VIEW_EXPANDED.includes(view as EntityViewExpanded);
const EntityView = observer(() => {
  const workflowStore = useWorkflowStore();
  const mobileStore = useMobileStore();

  const selectedEntityId = mobileStore.ctx.selectedEntityId;

  React.useEffect(() => {
    if (typeof selectedEntityId === "number") {
      void workflowStore.loadEntity(selectedEntityId);
    }
  }, [workflowStore, selectedEntityId]);

  return (
    <>
      <EntityViewTitle />
      <EntityViewContent />
    </>
  );
});
const EntityViewTitle = observer(() => {
  const workflowStore = useWorkflowStore();
  const mobileStore = useMobileStore();

  const isExpanded = isEntityViewExpanded(mobileStore.ctx.currentView);
  const entity =
    typeof mobileStore.ctx.selectedEntityId === "number"
      ? workflowStore.workflowEntities.get(mobileStore.ctx.selectedEntityId)
      : undefined;

  const stateId = entity?.id
    ? workflowStore.workflowEntities.get(entity.id)?.currentStateId
    : undefined;
  const currentStateId = React.useRef(stateId);
  React.useEffect(() => {
    if (
      typeof currentStateId.current === "number" &&
      typeof stateId === "number" &&
      currentStateId.current !== stateId
    ) {
      // entity current state updated so update the selected state to match it
      mobileStore.selectState(stateId, true);
    }
    currentStateId.current = stateId;
  }, [stateId, mobileStore]);

  return entity ? (
    <div
      className="border-y-2 pb-2 border-accent relative"
      onClick={() => mobileStore.setCurrentView("ENTITY_ATTRS")}
    >
      <span className="absolute text-5xl left-0 font-mono top-1">E</span>
      <h2
        className={cn("text-3xl font-bold text-center mx-16 py-1", {
          "line-clamp-1": !isExpanded,
          "line-clamp-2": isExpanded,
        })}
      >
        {entity?.name}
      </h2>
    </div>
  ) : null;
});
const EntityViewContent = observer(() => {
  const mobileStore = useMobileStore();

  const view = mobileStore.ctx.currentView;
  const isExpanded = isEntityViewExpanded(view);

  const swipeHandlers = useSwipeable({
    onSwiped: getNextFromSwipeHOF(mobileStore, ENTITY_VIEW_EXPANDED),
  });

  return (
    <div
      {...swipeHandlers}
      className={cn("h-full transition-all duration-150 overflow-y-auto", {
        "scale-y-0 hidden": !isExpanded,
      })}
    >
      {isExpanded ? (
        <Tabs
          value={view}
          onValueChange={(v) =>
            mobileStore.setCurrentView(v as MobileManagerView)
          }
        >
          <TabsList className="w-full py-2 flex justify-center">
            <TabsTrigger value="ENTITY_ATTRS">Entity attributes</TabsTrigger>
            <TabsTrigger value="ENTITY_MOVE">Move to state</TabsTrigger>
          </TabsList>
          <div className="p-4">
            <TabsContent value="ENTITY_ATTRS">
              <EntityAttrsView />
            </TabsContent>
            <TabsContent value="ENTITY_MOVE">
              <EntityMoveView />
            </TabsContent>
          </div>
        </Tabs>
      ) : null}
    </div>
  );
});
const EntityAttrsView = observer(() => {
  const mobileStore = useMobileStore();
  const workflowId = mobileStore.ctx.workflowId;
  const entityId = mobileStore.ctx.selectedEntityId;

  return (
    <div className="flex flex-col gap-4">
      {entityId ? (
        <AttributesForm
          workflowId={workflowId}
          refType="WORKFLOW_ENTITY"
          baseEntityId={entityId}
        />
      ) : null}
    </div>
  );
});
const EntityMoveView = observer(() => {
  const mobileStore = useMobileStore();
  const workflowId = mobileStore.ctx.workflowId;
  const entityId = mobileStore.ctx.selectedEntityId;

  return (
    <div className="flex flex-col gap-4">
      {entityId ? (
        <StateChangeOptions workflowId={workflowId} entityId={entityId} />
      ) : null}
    </div>
  );
});
