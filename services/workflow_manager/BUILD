load("@rules_java//java:defs.bzl", "java_binary", "java_library", "java_test")
load("//:build-tools/rules/java/open_api.bzl", "java_open_api_gen")
load("//:build-tools/rules/postgres/dev-server.bzl", "postgres_server")

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
        "@maven//:jakarta_persistence_jakarta_persistence_api",
        "@maven//:org_springdoc_springdoc_openapi_starter_webmvc_ui",
        "@maven//:org_springframework_boot_spring_boot",
        "@maven//:org_springframework_boot_spring_boot_autoconfigure",
        "@maven//:org_springframework_boot_spring_boot_starter_data_jpa",
        "@maven//:org_springframework_boot_spring_boot_starter_web",
        "@maven//:org_springframework_spring_web",
        "@maven//:jakarta_validation_jakarta_validation_api",
        "@maven//:jakarta_json_jakarta_json_api",
        "@maven//:jakarta_json_bind_jakarta_json_bind_api",
        "@maven//:org_springframework_data_spring_data_commons",
        "@maven//:org_springframework_data_spring_data_jpa",
        "@maven//:org_springframework_spring_aop",
        "@maven//:org_springframework_spring_context",
        "@maven//:org_springframework_spring_tx",
        # TODO: remove after find good solution for where to put it
        # without repeating this rule declaration
        "@maven//:com_h2database_h2",
        "@maven//:org_postgresql_postgresql",
        "@maven//:org_springframework_spring_beans",
        "@maven//:org_springframework_spring_core",
    ],
)

java_binary(
    name = "workflow_manager",
    main_class = "com.workflowmanager.app.App",
    resources = [":src/main/resources/application.properties"],
    runtime_deps = [":workflow_manager_lib"],
)

java_binary(
    name = "workflow_manager_open_api_bin",
    main_class = "com.workflowmanager.app.App",
    resources = [":src/main/resources/application-openapi-gen.properties"],
    runtime_deps = [":workflow_manager_lib"],
)

java_open_api_gen(
    name = "workflow_manager_open_api",
    java_bin = ":workflow_manager_open_api_bin",
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
