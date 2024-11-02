import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

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
              element: (
                <Suspense>
                  <WorkflowsPage />
                </Suspense>
              ),
            },
            {
              path: ":workflowId",
              element: (
                <Suspense>
                  <WorkflowManagePage />
                </Suspense>
              ),
            },
          ],
        },
      ],
    },
  ]);
