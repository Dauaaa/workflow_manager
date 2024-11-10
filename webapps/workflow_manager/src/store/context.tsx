import * as React from "react";
import { WorkflowStore } from "./workflow-store";

const WorkflowStoreContext = React.createContext<WorkflowStore>(
  null as unknown as WorkflowStore,
);

let x: any;

export const WorkflowStoreProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [store] = React.useState(new WorkflowStore());

  return (
    <WorkflowStoreContext.Provider value={store}>
      {children}
    </WorkflowStoreContext.Provider>
  );
};

export const useWorkflowStore = () => {
  const workflowStore = React.useContext(WorkflowStoreContext);

  // implementation error so just throw
  if (workflowStore === null)
    throw Error("useWorkflowStore called outside store context");

  return workflowStore;
};
