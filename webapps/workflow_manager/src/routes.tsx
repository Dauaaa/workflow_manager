import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthenticationDisplay } from "./features/authentication-display";

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
          element: (
            <div>
              <Outlet />
              <AuthenticationDisplay />
            </div>
          ),
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
