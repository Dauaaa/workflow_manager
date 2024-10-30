load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@npm//:openapi-typescript/package_json.bzl", open_api_ts_bin = "bin")
load("//:build-tools/rules/general/sync_source.bzl", "sync_source")

ts_project(
    name = "workflow_manager_open_api_ts",
    srcs = [
        ":workflow_manager_api_types",
        "package.json",
        "tsconfig.json",
    ],
    declaration = True,
    data = [
        "//:node_modules/openapi-fetch",
        "//:node_modules/openapi-react-query",
    ],
    transpiler = "tsc",
    # transpile time direct dependencies
    deps = [
        "//:node_modules/openapi-typescript",
        "//:node_modules/typescript",

    ],
)

genrule(
    name = "workflow_manager_api_types",
    srcs = ["//:node_modules/openapi-typescript/dir", "//services/workflow_manager:workflow_manager_open_api"],
    outs = ["index.ts"],
    cmd = """
    node $(location //:node_modules/openapi-typescript/dir)/bin/cli.js \
         $(location //services/workflow_manager:workflow_manager_open_api) > $@
""",
    visibility = ["//visibility:public"],
)

# make this library available via node_modules
npm_package(
    name = "pkg",
    srcs = [
        ":workflow_manager_open_api_ts",
    ],
    visibility = ["//visibility:public"],
    out = "pkg",
)

sync_source("webapps/libs/workflow_manager_api/index.ts", "//webapps/libs/workflow_manager_api:index.ts")
