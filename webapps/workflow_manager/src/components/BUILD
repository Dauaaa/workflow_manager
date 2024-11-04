load("//:build-tools/rules/ts/vite.bzl", "vite_ts_project")

vite_ts_project(
    name = "theme-provider",
    srcs = ["theme-provider.tsx"],
    declaration = True,
    resolve_json_module = True,
    transpiler = "tsc",
    tsconfig = "//webapps/workflow_manager:tsconfig",
    visibility = ["//webapps/workflow_manager:__subpackages__"],
    deps = [
        "//webapps/workflow_manager:node_modules/@types/react",
        "//webapps/workflow_manager:node_modules/@types/react-dom",
        "//webapps/workflow_manager:node_modules/react",
    ]
)

vite_ts_project(
    name = "form-submitter",
    srcs = ["form-submitter.tsx"],
    declaration = True,
    resolve_json_module = True,
    transpiler = "tsc",
    tsconfig = "//webapps/workflow_manager:tsconfig",
    visibility = ["//webapps/workflow_manager:__subpackages__"],
    deps = [
        "//webapps/workflow_manager:node_modules/@types/react",
        "//webapps/workflow_manager:node_modules/@types/react-dom",
        "//webapps/workflow_manager:node_modules/react",
        "//webapps/workflow_manager:node_modules/react-hook-form",
        "//webapps/workflow_manager:node_modules/zod",
        "//webapps/workflow_manager/src/components/ui",
    ]
)
