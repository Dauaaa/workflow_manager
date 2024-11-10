load("@rules_java//java:defs.bzl", "java_binary", "java_library", "java_test")
load("@rules_spring//springboot:springboot.bzl", "springboot")
load("//:build-tools/rules/java/oci.bzl", "springboot_oci")
load("//:build-tools/rules/java/open_api.bzl", "java_open_api_gen")

java_deps = [
        "@maven//:jakarta_persistence_jakarta_persistence_api",
        "@maven//:org_springframework_boot_spring_boot",
        "@maven//:org_springframework_boot_spring_boot_actuator",
        "@maven//:org_springframework_boot_spring_boot_actuator_autoconfigure",
        "@maven//:org_springframework_boot_spring_boot_autoconfigure",
        "@maven//:org_springframework_boot_spring_boot_loader_classic",
        "@maven//:org_springframework_boot_spring_boot_starter",
        "@maven//:org_springframework_boot_spring_boot_starter_logging",
        "@maven//:org_springframework_spring_aop",
        "@maven//:org_springframework_spring_beans",
        "@maven//:org_springframework_spring_context",
        "@maven//:org_springframework_spring_core",
        "@maven//:org_springframework_spring_expression",
        "@maven//:org_springdoc_springdoc_openapi_starter_webmvc_ui",
        "@maven//:org_springframework_boot_spring_boot_starter_data_jpa",
        "@maven//:org_springframework_boot_spring_boot_starter_web",
        "@maven//:org_springframework_boot_spring_boot_starter_validation",
        "@maven//:org_springframework_boot_spring_boot_starter_amqp",
        "@maven//:org_springframework_spring_web",
        "@maven//:org_zalando_problem_spring_web_starter",
        "@maven//:jakarta_validation_jakarta_validation_api",
        "@maven//:jakarta_json_jakarta_json_api",
        "@maven//:jakarta_json_bind_jakarta_json_bind_api",
        "@maven//:org_springframework_data_spring_data_commons",
        "@maven//:org_springframework_data_spring_data_jpa",
        "@maven//:org_springframework_spring_tx",
        # TODO: remove after find good solution for where to put it
        # without repeating this rule declaration
        "@maven//:com_h2database_h2",
        "@maven//:org_postgresql_postgresql",
        "@maven//:io_swagger_core_v3_swagger_annotations_jakarta",
        "@maven//:org_zalando_problem",
        "@maven//:com_fasterxml_jackson_core_jackson_annotations",
        "@maven//:dev_cel_cel",
        "@maven//:io_hypersistence_hypersistence_utils_hibernate_60",
        "@maven//:org_hibernate_orm_hibernate_core",
        "@maven//:jakarta_annotation_jakarta_annotation_api",
        "@maven//:org_springframework_amqp_spring_amqp",
        "@maven//:org_springframework_amqp_spring_rabbit",
        "@maven//:com_fasterxml_jackson_core_jackson_core",
        "@maven//:com_fasterxml_jackson_core_jackson_databind",
        "@maven//:com_fasterxml_jackson_datatype_jackson_datatype_jsr310",
    ]

java_library(
    name = "workflow_manager_lib",
    srcs = glob(["src/main/java/com/workflowmanager/**/*.java"]),
    javacopts = [
        "-source",
        "21",
        "-target",
        "21",
    ],
    deps = java_deps,
)

java_binary(
    name = "workflow_manager",
    main_class = "com.workflowmanager.app.App",
    resources = [":src/main/resources/application-local.properties"],
    runtime_deps = [":workflow_manager_lib"],
    args = ["--spring.profiles.active=local"],
)

java_binary(
    name = "workflow_manager_open_api_bin",
    main_class = "com.workflowmanager.app.App",
    resources = [":src/main/resources/application-openapi.properties"],
    runtime_deps = [":workflow_manager_lib"],
    args = ["--spring.profiles.active=openapi"],
)

java_open_api_gen(
    name = "workflow_manager_open_api",
    java_bin = ":workflow_manager_open_api_bin",
    visibility = ["//visibility:public"],
    resources = [":src/main/resources/application-openapi.properties"]
)

java_library(
    name = "workflow_manager_deployment_lib",
    srcs = glob(["src/main/java/com/workflowmanager/**/*.java"]),
    javacopts = [
        "-source",
        "21",
        "-target",
        "21",
    ],
    deps = java_deps,
    resources = [":src/main/resources/application.properties"],
)

# Build the app as a Spring Boot executable jar
springboot(
    name = "workflow_manager_deployment",
    boot_app_class = "com.workflowmanager.app.App",
    java_library = ":workflow_manager_deployment_lib",
)

springboot_oci(
    name = "workflow_manager_deployment",
    package_name = package_name(),
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
