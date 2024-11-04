load("//:build-tools/rules/ts/vite.bzl", "vite_ts_project")

vite_ts_project(
    name = "workflow-manage",
    srcs = ["index.tsx"],
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
        "//webapps/workflow_manager:node_modules/mobx-react-lite",
        "//webapps/workflow_manager:node_modules/@radix-ui/react-icons",
        "//webapps/workflow_manager/src/features:new-state-form",
        "//webapps/workflow_manager/src/features:new-entity-form",
        "//webapps/workflow_manager/src/features:set-config-form",
        "//webapps/workflow_manager/src/features:attributes-form",
        "//webapps/workflow_manager/src/features:state-change-options",
        "//webapps/workflow_manager/src/features:change-state-rules-form",
        "//webapps/workflow_manager/src/components/ui",
        "//webapps/workflow_manager/src/lib:utils",
        "//webapps/workflow_manager/src/store:workflow-store",
    ]
)
