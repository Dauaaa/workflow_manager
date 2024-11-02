import { createContext, useContext, useState } from "react";
import { WorkflowStore } from "./workflow-store";

const WorkflowStoreContext = createContext<WorkflowStore>(null as unknown as WorkflowStore);

export const WorkflowStoreProvider = ({ children }: { children: React.ReactNode }) => {
    const [store] = useState(new WorkflowStore());

    return <WorkflowStoreContext.Provider value={store}>
        {children}
    </WorkflowStoreContext.Provider>
}

export const useWorkflowStore = () => {
    const workflowStore = useContext(WorkflowStoreContext);

    // implementation error so just throw
    if (workflowStore === null) throw Error("useWorkflowStore called outside store context");

    return workflowStore;
}
