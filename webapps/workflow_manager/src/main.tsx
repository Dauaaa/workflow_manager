import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { workflowManagerRouter } from "./routes";
import { WorkflowStoreProvider } from "./store/context";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WorkflowStoreProvider>
      <RouterProvider router={workflowManagerRouter} />
    </WorkflowStoreProvider>
  </StrictMode>,
);
