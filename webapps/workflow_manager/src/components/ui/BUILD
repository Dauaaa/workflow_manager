load("//:build-tools/rules/ts/vite.bzl", "vite_ts_project")

vite_ts_project(
    name = "ui",
    srcs = glob(["*.tsx"]),
    declaration = True,
    resolve_json_module = True,
    transpiler = "tsc",
    tsconfig = "//webapps/workflow_manager:tsconfig",
    visibility = ["//webapps/workflow_manager:__subpackages__"],
    deps = [
        "//webapps/workflow_manager:node_modules/@types/react",
        "//webapps/workflow_manager:node_modules/@types/react-dom",
        "//webapps/workflow_manager:node_modules/react",
        "//webapps/workflow_manager:node_modules/@radix-ui/react-label",
        "//webapps/workflow_manager:node_modules/@radix-ui/react-slot",
        "//webapps/workflow_manager:node_modules/class-variance-authority",
        "//webapps/workflow_manager:node_modules/react-hook-form",
        "//webapps/workflow_manager:node_modules/@radix-ui/react-popover",
        "//webapps/workflow_manager/src/lib:utils",
    ]
)
