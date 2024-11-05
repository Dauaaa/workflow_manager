import { Button } from "@/components/ui/button";
import { useWorkflowStore } from "@/store/context";
import { observer } from "mobx-react-lite";

export const AuthenticationDisplay = observer(() => {
  const workflowStore = useWorkflowStore();

  return (
    <div className="flex justify-between w-[100vw] fixed bottom-0 pb-4 px-4 text-secondary-foreground text-sm">
      <Button onClick={() => workflowStore.setAuthentication()}>Logout</Button>
      <span>
        uid: {workflowStore.authentication.current?.userId}; cid:{" "}
        {workflowStore.authentication.current?.clientId}
      </span>
    </div>
  );
});
