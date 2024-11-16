import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import * as React from "react";
import { AuthenticationDisplay } from "./features/authentication-display";
import { WorkflowStoreProvider } from "./store/context";
import { AuthenticationManager } from "./features/authentication-manager";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";

const WorkflowsPage = React.lazy(() => import("./pages/workflows"));
const WorkflowManagePage = React.lazy(() => import("./pages/workflow-manage"));

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
            <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
              <WorkflowStoreProvider>
                <AuthenticationManager />
                <Outlet />
                <AuthenticationDisplay />
                <Toaster />
              </WorkflowStoreProvider>
            </ThemeProvider>
          ),
          children: [
            {
              index: true,
              element: (
                <React.Suspense>
                  <WorkflowsPage />
                </React.Suspense>
              ),
            },
            {
              path: ":workflowId",
              element: (
                <React.Suspense>
                  <WorkflowManagePage />
                </React.Suspense>
              ),
            },
          ],
        },
      ],
    },
  ]);
