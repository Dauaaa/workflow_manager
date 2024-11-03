import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { AttributesForm } from "@/features/attributes-form";
import { NewEntityForm } from "@/features/new-entity-form";
import { NewStateForm } from "@/features/new-state-form";
import { SetConfigForm } from "@/features/set-config-form";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/context";
import {
  Workflow,
  WorkflowAttributeReferenceTypePretty,
  WorkflowEntity,
  WorkflowState,
} from "@/store/workflow-store";
import { CubeIcon, GearIcon } from "@radix-ui/react-icons";
import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useState, createContext, useContext } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

type SheetContext = Parameters<typeof AttributesForm>[0];

class PageStore {
  public drawerContext: { current?: SheetContext } = {};
  public setSheetContext = (ctx?: SheetContext) =>
    (this.drawerContext.current = ctx);
  public setSheetContextEntity = (entity: WorkflowEntity) =>
    this.setSheetContext({
      workflowId: entity.workflowId,
      refType: "WORKFLOW_ENTITY",
      baseEntityId: entity.id,
    });
  public setSheetContextState = (state: WorkflowState) =>
    this.setSheetContext({
      workflowId: state.workflowId,
      refType: "WORKFLOW_STATE",
      baseEntityId: state.id,
    });
  public setSheetContextWorkflow = (workflow: Workflow) =>
    this.setSheetContext({
      workflowId: workflow.id,
      refType: "WORKFLOW",
      baseEntityId: workflow.id,
    });

  public constructor() {
    makeAutoObservable(this);
  }
}

const usePageStore = () => useState(new PageStore())[0];

const PageContext = createContext<PageStore>(null as unknown as PageStore);

const WorkflowManagePage = observer(() => {
  const { workflowId } = useParams();

  if (!workflowId || Number.isNaN(Number(workflowId)))
    return <Navigate to="/" />;

  const workflowIdN = Number(workflowId);

  const workflowStore = useWorkflowStore();

  useEffect(() => {
    void workflowStore.loadWorkflow(workflowIdN);
    void workflowStore.loadStates(workflowIdN);
  }, [workflowStore]);

  const pageStore = usePageStore();

  return (
    <PageContext.Provider value={pageStore}>
      <AttributeSheet />
      <div className="w-4/5 mx-auto">
        <StateCollapserList workflowId={workflowIdN} />
        <NewStateForm workflowId={workflowIdN} />
        <SetConfigForm workflowId={workflowIdN} />
        <NewEntityForm workflowId={workflowIdN} />
      </div>
    </PageContext.Provider>
  );
});

const StateCollapserList = observer(
  ({ workflowId }: { workflowId: number }) => {
    const workflowStore = useWorkflowStore();

    return (
      <div className="flex flex-col gap-4 mb-4">
        {[...workflowStore.workflowStates.values()]
          .filter((state) => state.workflowId === workflowId)
          .map((state) => (
            <StateCollapser state={state} key={state.id} />
          ))}
      </div>
    );
  },
);

const StateCollapser = ({ state }: { state: WorkflowState }) => {
  const [isOpen, setIsOpen] = useState(false);

  const pageStore = useContext(PageContext);

  return (
    <Collapsible onOpenChange={setIsOpen}>
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
          <div className="flex justify-end">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                pageStore.setSheetContextState(state);
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
};

const EntityList = observer(({ stateId }: { stateId: number }) => {
  const workflowStore = useWorkflowStore();

  useEffect(() => {
    void workflowStore.loadState(stateId);
    void workflowStore.loadEntitiesByState(stateId);
  }, [workflowStore]);

  const entities = [
    ...(workflowStore.workflowEntitiesByState.get(stateId)?.values() ?? []),
  ];

  return (
    <div className="border rounded-b-xl flex flex-col">
      {entities.map((entity, idx) => (
        <EntityEntry
          key={entity.id}
          entity={entity}
          isLast={idx === entities.length - 1}
        />
      ))}
      {entities.length === 0 ? (
        <div className="h-36 w-full flex justify-center">
          <div className="flex flex-col my-auto gap-2">
            <CubeIcon className="h-20 w-20" />
            <p className="text-center font-mono">No entities</p>
          </div>
        </div>
      ) : null}
    </div>
  );
});

const EntityEntry = ({
  entity,
  isLast,
}: {
  entity: WorkflowEntity;
  isLast?: boolean;
}) => {
  const pageStore = useContext(PageContext);

  return (
    <div
      className={cn(
        "w-full border hover:bg-accent text-mono text-xl pl-8 py-2",
        { "rounded-b-xl": isLast },
      )}
      onClick={() => pageStore.setSheetContextEntity(entity)}
    >
      {entity.name}
    </div>
  );
};

const AttributeSheet = observer(() => {
  const pageStore = useContext(PageContext);
  const workflowStore = useWorkflowStore();

  const ctx = pageStore.drawerContext.current;
  const currentEntityName = ctx
    ? workflowStore.getFromIdAndReference(ctx)?.name
    : undefined;

  return (
    <Sheet
      open={!!ctx}
      onOpenChange={(open) => {
        if (!open) pageStore.setSheetContext(undefined);
      }}
    >
      <SheetContent className="sm:max-w-none max-w-3/5 w-[80vw]">
        {ctx ? (
          <>
            <h2 className="text-xl font-bold">
              Attributes for {WorkflowAttributeReferenceTypePretty[ctx.refType]}
              : {currentEntityName}
            </h2>
            <AttributesForm {...ctx} />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
});

export default WorkflowManagePage;
