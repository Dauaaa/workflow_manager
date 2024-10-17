load("@aspect_rules_js//js:defs.bzl", "js_library", "js_test")
load("@aspect_rules_ts//ts:defs.bzl", "ts_config")
load("@bazel_skylib//rules:build_test.bzl", "build_test")
load("@bazel_skylib//rules:write_file.bzl", "write_file")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("@npm//:postcss-cli/package_json.bzl", postcss_cli = "bin")
load("@npm//webapps/landing_page:next/package_json.bzl", next_bin = "bin")
load("//:build-tools/rules/ts/nextjs.bzl", "next")
load("//:build-tools/rules/ts/tailwind.bzl", "tailwind")

npm_link_all_packages(name = "node_modules")

next_bin.next_binary(
    name = "next_js_binary",
    visibility = [":__subpackages__"],
)

tailwind(
    name = "tailwind",
    css_files = ["main.css"],
    srcs = [
        "//webapps/landing_page/src/app",
        ":node_modules",
        ":project_settings",
    ],
)

next(
    srcs = [
        ":tailwind",
        "//webapps/landing_page/src/app",
        "//webapps/landing_page/src/app:public",
    ],
    data = [
        ":node_modules/next",
        ":node_modules/react",
        ":node_modules/react-dom",
        ":node_modules/typescript",
        ":node_modules/tailwindcss",
        ":node_modules/autoprefixer",
        ":project_settings",
    ],
    next_bin = "./node_modules/next/dist/bin/next",
    next_js_binary = ":next_js_binary",
)

js_library(
    name = "project_settings",
    srcs = [
        "main.css",
        "next.config.mjs",
        "package.json",
        "postcss.config.mjs",
        "tailwind.config.ts",
    ],
)

ts_config(
    name = "tsconfig",
    src = "tsconfig.json",
    visibility = ["//visibility:public"],
)
