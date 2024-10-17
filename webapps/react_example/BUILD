load("@aspect_rules_js//js:defs.bzl", "js_library", "js_run_devserver")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("@npm//webapps/react_example:vite/package_json.bzl", vite_bin = "bin")
load("@bazel_skylib//rules:write_file.bzl", "write_file")
load("@aspect_rules_ts//ts:defs.bzl", "ts_config")
load("//:build-tools/rules/ts/tailwind.bzl", "tailwind")
load("//:build-tools/rules/ts/vite.bzl", "vite")

npm_link_all_packages(name = "node_modules")

vite_bin.vite_binary(
    name = "vite_binary",
)

tailwind(
    name = "tailwind",
    css_files = ["main.css"],
    srcs = [
        "//webapps/react_example/src:app",
        ":node_modules",
        ":project_settings",
    ],
)

vite(
    vite_binary = ":vite_binary",
    srcs = [
        "//webapps/react_example/src:app",
        "index.html",
        ":node_modules",
        ":project_settings",
        ":tsconfig",
    ],
)

ts_config(
    name = "tsconfig",
    src = "tsconfig.json",
    visibility = ["//visibility:public"],
)

js_library(
    name = "project_settings",
    srcs = [
        "main.css",
        "package.json",
        "postcss.config.mjs",
        "tailwind.config.ts",
        "vite.config.mjs",
    ],
)
