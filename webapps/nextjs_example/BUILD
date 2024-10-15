load("@aspect_rules_js//js:defs.bzl", "js_library", "js_test")
load("@aspect_rules_ts//ts:defs.bzl", "ts_config")
load("@bazel_skylib//rules:build_test.bzl", "build_test")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("@npm//webapps/nextjs_example:next/package_json.bzl", next_bin = "bin")
load("@npm//:postcss-cli/package_json.bzl", postcss_cli = "bin")
load("//:build-tools/rules/ts/nextjs.bzl", "next")

npm_link_all_packages(name = "node_modules")

next_bin.next_binary(
    name = "next_js_binary",
    visibility = [":__subpackages__"]
)

postcss_cli.postcss_binary(
    name = "tailwind_generator",
    fixed_args = [
        # Don't use location here since chdir will cd
        # to this directory, otherwise path relative to
        # rootpath will be used (which is wrong)
        "main.css",
        "--config",
        "postcss.config.js",
    ],
    chdir = package_name(),
)

genrule(
    name = "tailwind",
    tools = [":tailwind_generator"],
    visibility = [":__subpackages__"],
    srcs = [
        # need to pass all targets in the repo
        "//webapps/nextjs_example/pages",
        ":style_configs",
        ":node_modules"
    ],
    outs = ["tailwind.css"],
    cmd = "BAZEL_BINDIR=$(BINDIR) $(location :tailwind_generator) > $@",
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
    srcs = ["main.css", "postcss.config.js", "tailwind.config.js"],
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
