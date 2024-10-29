load("//:build-tools/rules/ts/vite.bzl", "vite_ts_project")

vite_ts_project(
    name = "workflow-store",
    srcs = ["workflow-store.ts"],
    declaration = True,
    resolve_json_module = True,
    transpiler = "tsc",
    tsconfig = "//webapps/workflow_manager:tsconfig",
    visibility = ["//webapps/workflow_manager:__subpackages__"],
    deps = [
        "//webapps/workflow_manager:type_declarations",
        "//webapps/workflow_manager:node_modules/@types/react",
        "//webapps/workflow_manager:node_modules/@types/react-dom",
        "//webapps/workflow_manager:node_modules/react",
        "//webapps/workflow_manager:node_modules/workflow_manager_api",
        "//webapps/workflow_manager:node_modules/zod",
        "//webapps/workflow_manager:node_modules/common_schemas",
        "//:node_modules/openapi-fetch",
    ]
)
