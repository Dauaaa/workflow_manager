load("@aspect_rules_js//js:defs.bzl", "js_library", "js_test",  "js_run_binary")
load("@aspect_rules_ts//ts:defs.bzl", "ts_config")
load("@bazel_skylib//rules:build_test.bzl", "build_test")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("@npm//webapps/nextjs_example:next/package_json.bzl", next_bin = "bin")
load("//:build-tools/rules/ts/nextjs.bzl", "next")
load("//:build-tools/rules/ts/tailwind.bzl", "tailwind")

npm_link_all_packages(name = "node_modules")

next_bin.next_binary(
    name = "next_js_binary",
    visibility = [":__subpackages__"]
)

tailwind(
    name = "tailwind",
    css_files = ["main.css"],
    srcs = [
        "//webapps/nextjs_example/pages",
        "//webapps/nextjs_example/public",
        "//webapps/nextjs_example/styles",
        ":node_modules",
        ":style_configs",
    ],
)

ts_config(
    name = "tsconfig",
    src = "tsconfig.json",
    visibility = ["//visibility:public"],
)

next(
    name = "next",
    srcs = [
        "//webapps/nextjs_example/pages",
        "//webapps/nextjs_example/public",
        "//webapps/nextjs_example/styles",
        ":tailwind",
    ],
    data = [
        "next.config.js",
        "package.json",
        ":node_modules/next",
        ":node_modules/react",
        ":node_modules/react-dom",
        ":node_modules/typescript",
    ],
    next_bin = "./node_modules/next/dist/bin/next",
    next_js_binary = ":next_js_binary",
)

js_library(
    name = "package_json",
    srcs = ["package.json"],
    visibility = ["//visibility:public"],
)

js_library(
    name = "style_configs",
    srcs = ["main.css", "postcss.config.mjs", "tailwind.config.js"],
)

js_library(
    name = "eslintrc",
    srcs = [".eslintrc.js"],
    visibility = ["//:__subpackages__"],
    deps = [
        ":node_modules/@next/eslint-plugin-next",
        ":node_modules/eslint-config-next",
    ],
)

js_library(
    name = "jest_config",
    srcs = ["jest.config.js"],
    visibility = ["//visibility:public"],
    deps = [":node_modules/next"],
)
