import dayjs from "dayjs";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { workflowManagerRouter } from "./routes";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={workflowManagerRouter} />
  </React.StrictMode>,
);
