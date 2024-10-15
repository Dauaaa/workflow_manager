load("@rules_java//java:defs.bzl", "java_binary", "java_library", "java_test")
load("//:build-tools/rules/java/open_api.bzl", "java_open_api_gen")

java_library(
    name = "workflow_manager_lib",
    srcs = glob(["src/main/java/com/workflowmanager/**/*.java"]),
    javacopts = [
        "-source",
        "21",
        "-target",
        "21",
    ],
    deps = [
        "@maven//:org_springframework_boot_spring_boot_starter_web",
        "@maven//:org_springframework_boot_spring_boot",
        "@maven//:org_springframework_boot_spring_boot_autoconfigure",
        "@maven//:org_springdoc_springdoc_openapi_starter_webmvc_ui",
        "@maven//:org_springframework_spring_web",
    ],
)

java_binary(
    name = "workflow_manager",
    main_class = "com.workflowmanager.App",
    runtime_deps = [":workflow_manager_lib"],
)

java_open_api_gen(
    name = "workflow_manager_open_api",
    java_bin = ":workflow_manager",
    visibility = ["//visibility:public"],
)

# example test
# java_test(
#     name = "tests",
#     srcs = glob(["src/test/java/com/example/myproject/*.java"]),
#     test_class = "com.example.myproject.TestApp",
#     deps = [
#         ":java-maven-lib",
#         "@maven//:com_google_guava_guava",
#         "@maven//:junit_junit",
#     ],
# )
