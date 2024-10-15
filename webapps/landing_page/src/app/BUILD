load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@aspect_rules_js//js:defs.bzl", "js_library")
load("@aspect_bazel_lib//lib:copy_to_bin.bzl", "copy_to_bin")

filegroup(
    name = "app_file_group",
    srcs = [":app", ":x"],
    visibility = ["//webapps/landing_page:__pkg__"],
)

ts_project(
    name = "app",
    srcs = [
        "page.tsx",
        "layout.tsx",
    ],
    declaration = True,
    resolve_json_module = True,
    transpiler = "tsc",
    tsconfig = "//webapps/landing_page:tsconfig",
    visibility = ["//webapps/landing_page:__subpackages__"],
    deps = [
        ":x",
        "//webapps/landing_page:node_modules/@types/react",
        "//webapps/landing_page:node_modules/@types/react-dom",
        "//webapps/landing_page:node_modules/next",
    ],
)

ts_project(
    name = "x",
    srcs = [
        "x.tsx",
    ],
    declaration = True,
    resolve_json_module = True,
    transpiler = "tsc",
    tsconfig = "//webapps/landing_page:tsconfig",
    visibility = ["//webapps/landing_page:__subpackages__"],
    deps = [
        "//webapps/landing_page:node_modules/@types/react",
        "//webapps/landing_page:node_modules/@types/react-dom",
    ],
)

js_library(
    name = "public",
    srcs = [
        "favicon.ico",
    ],
    visibility = ["//webapps/landing_page:__subpackages__"],
)
