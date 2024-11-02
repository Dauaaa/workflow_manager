load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("//:build-tools/rules/ts/vite.bzl", "vite_ts_project")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//:build-tools/rules/general/sync_source.bzl", "sync_source")

npm_link_all_packages(name = "node_modules")

vite_ts_project(
    name = "common_schemas",
    srcs = [
        "index.ts",
        "package.json",
        "tsconfig.json",
    ],
    declaration = True,
    transpiler = "tsc",
    deps = [
        ":node_modules/zod",
        ":node_modules/dayjs",
        ":node_modules/decimal.js",
    ],
)

# make this library available via node_modules
npm_package(
    name = "pkg",
    srcs = [
        ":common_schemas",
    ],
    visibility = ["//visibility:public"],
    data = [
        ":node_modules/zod",
        ":node_modules/dayjs",
        ":node_modules/decimal.js",
    ],
    out = "pkg",
)
