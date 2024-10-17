load("//:build-tools/rules/ts/vite.bzl", "vite_ts_project")

vite_ts_project(
    name = "app",
    srcs = ["main.tsx"],
    declaration = True,
    resolve_json_module = True,
    transpiler = "tsc",
    tsconfig = "//webapps/react_example:tsconfig",
    visibility = ["//webapps/react_example:__subpackages__"],
    deps = [
        "//webapps/react_example:node_modules/@types/react",
        "//webapps/react_example:node_modules/@types/react-dom",
        "//webapps/react_example:node_modules/react",
    ]
)
