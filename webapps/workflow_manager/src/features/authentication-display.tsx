import { Button } from "@/components/ui/button";
import { useWorkflowStore } from "@/store/context";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const AuthenticationDisplay = observer(() => {
  const workflowStore = useWorkflowStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const auth = workflowStore.authentication.current;

  useEffect(() => {
    if (!auth && pathname !== "/workflows") navigate("/workflows");
  }, [auth, navigate, pathname]);

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
