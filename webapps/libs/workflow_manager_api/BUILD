load("@npm//:openapi-typescript/package_json.bzl", open_api_ts_bin = "bin")
load("//:build-tools/rules/general/sync_source.bzl", "sync_source")

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

sync_source("webapps/libs/workflow_manager_api/index.ts", "//webapps/libs/workflow_manager_api:index.ts")
