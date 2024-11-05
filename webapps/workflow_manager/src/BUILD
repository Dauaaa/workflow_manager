load("//:build-tools/rules/ts/vite.bzl", "vite_ts_project")

vite_ts_project(
    name = "app",
    srcs = ["main.tsx", "routes.tsx"],
    declaration = True,
    resolve_json_module = True,
    transpiler = "tsc",
    tsconfig = "//webapps/workflow_manager:tsconfig",
    visibility = ["//webapps/workflow_manager:__subpackages__"],
    deps = [
        "//webapps/workflow_manager:node_modules/@types/react",
        "//webapps/workflow_manager:node_modules/@types/react-dom",
        "//webapps/workflow_manager:node_modules/react",
        "//webapps/workflow_manager:node_modules/react-router-dom",
        "//webapps/workflow_manager:node_modules/dayjs",
        "//webapps/workflow_manager/src/pages/workflows",
        "//webapps/workflow_manager/src/pages/workflow-manage",
        "//webapps/workflow_manager/src/store:workflow-store",
        "//webapps/workflow_manager/src/components:theme-provider",
        "//webapps/workflow_manager/src/features:authentication-context",
        "//webapps/workflow_manager/src/features:authentication-display",
    ]
)
