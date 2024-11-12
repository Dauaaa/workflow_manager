import { useWorkflowStore } from "@/store/context";
import { observer } from "mobx-react-lite";
import * as React from "react";
import { Navigate, useParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { DesktopManager } from "./desktop-manager";
import { MobileWorkflowManager } from "./mobile-manager";

const WorkflowManagePage = observer(() => {
  const { workflowId } = useParams();

  if (!workflowId || Number.isNaN(Number(workflowId)))
    return <Navigate to="/" />;

  const workflowIdN = Number(workflowId);

  const workflowStore = useWorkflowStore();

  React.useEffect(() => {
    void workflowStore.loadWorkflow(workflowIdN);
    void workflowStore.loadStates(workflowIdN);
    void workflowStore.loadAttributeDescriptions(workflowIdN);
  }, [workflowStore]);

  // the mobile and desktop view are too different
  const isMobile = useIsMobile();

  return isMobile ? (
    <MobileWorkflowManager workflowId={workflowIdN} />
  ) : (
    <DesktopManager workflowId={workflowIdN} />
  );
});

export default WorkflowManagePage;
