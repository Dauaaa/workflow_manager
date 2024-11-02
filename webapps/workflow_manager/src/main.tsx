import dayjs from "dayjs";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { workflowManagerRouter } from "./routes";
import { WorkflowStoreProvider } from "./store/context";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <WorkflowStoreProvider>
        <RouterProvider router={workflowManagerRouter} />
      </WorkflowStoreProvider>
    </ThemeProvider>
  </StrictMode>,
);
