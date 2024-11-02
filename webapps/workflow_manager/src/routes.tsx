import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy } from "react";

const WorkflowsPage = lazy(() => import("./pages/workflows"));
const WorkflowManagePage = lazy(() => import("./pages/workflow-manage"));

export const workflowManagerRouter: ReturnType<typeof createBrowserRouter> =
  createBrowserRouter([
    {
      path: "/",
      children: [
        {
          index: true,
          element: <Navigate to="/workflows" />,
        },
        {
          path: "workflows",
          children: [
            {
              index: true,
              element: <WorkflowsPage />,
            },
            {
              path: ":workflowId",
              element: <WorkflowManagePage />,
            },
          ],
        },
      ],
    },
  ]);
