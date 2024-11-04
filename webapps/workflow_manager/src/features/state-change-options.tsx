import { useWorkflowStore } from "@/store/context";
import { ChangeStateRule, WorkflowState } from "@/store/workflow-store";
import { observer } from "mobx-react-lite";

export const StateChangeOptions = observer(
  ({ workflowId, entityId }: { workflowId: number; entityId: number }) => {
    const workflowStore = useWorkflowStore();

    // TODO: uncomment after patched store to allow calling
    // multiple times without making multiple requests
    // useEffect(() => {
    //   void workflowStore.loadAttributeDescriptions(workflowId);
    //   void workflowStore.loadAttributes({
    //     workflowId,
    //     baseEntityId,
    //     refType,
    //   });
    //   void workflowStore.loadStates(workflowId);
    // }, []);

    const entity = workflowStore.workflowEntities.get(entityId);
    const states = workflowStore.workflowStatesByWorkflow.get(workflowId);
    const curState =
      entity && states ? states.get(entity.currentStateId) : undefined;

    return (
      <div className="flex flex-col gap-4 font-mono">
        {curState?.changeRules.flatMap((rule) => {
          const toState = states?.get(rule.toId);
          return toState
            ? [
                <ChangeStateItem
                  state={toState}
                  rule={rule}
                  entityId={entityId}
                />,
              ]
            : [];
        }) ?? null}
      </div>
    );
  },
);

const ChangeStateItem = ({
  state,
  entityId,
}: {
  state: WorkflowState;
  rule: ChangeStateRule;
  entityId: number;
}) => {
  const workflowStore = useWorkflowStore();

  // TODO: validate rule here and give visual feedback if can change state
  return (
    <div
      className="border rounded-3xl px-8 py-4 text-xl font-bold w-72 line-clamp-1 hover:bg-accent hover:cursor-pointer"
      onClick={() =>
        workflowStore.moveState({
          entityId,
          newStateId: state.id,
        })
      }
    >
      {state.name}
    </div>
  );
};
