load("@bazel_skylib//rules:diff_test.bzl", "diff_test")
load("@bazel_skylib//rules:write_file.bzl", "write_file")

def sync_source(absolute_source_path, absolute_file_label):
    """
Macro for copying output file to source.

Generates test that checks if generated file is synced to source.

Get all update targets:
bazel query 'kind("sh_binary", filter(".*_update_sync_source$", //...))'
Get all test targets:
bazel query 'kind("diff_test", filter(".*_check_sync_source$", //...))'

Update all targets:
bazel query 'kind("sh_binary", filter(".*_update_sync_source$", //...))' | xargs -I {} bazel run {}
Test all targets
bazel query 'kind("diff_test", filter(".*_check_sync_source$", //...))' | xargs -I {} bazel test {}
"""
    labels_prefix = absolute_file_label.split(":")[1].replace("/", "_").replace(".", "_")
    test_label = labels_prefix + "_check_sync_source"
    update_label = labels_prefix + "_update_sync_source"

    # relative to current package
    relative_source_path = absolute_source_path.split(native.package_name() + "/")[1]

    # Create a test target for each file that Bazel should
    # write to the source tree.
    diff_test(
        name = test_label,
        # Make it trivial for devs to understand that if
        # this test fails, they just need to run the updater
        # Note, you need bazel-skylib version 1.1.1 or greater
        # to get the failure_message attribute
        failure_message = "Please run:  bazel run //{pkg}:{update_label}".format(
            pkg = native.package_name(),
            update_label = update_label,
        ),
        file1 = relative_source_path,
        file2 = absolute_file_label,
    )

    # Generate the updater script so there's only one target for devs to run,
    # even if many generated files are in the source folder.
    write_file(
        name = labels_prefix + "_gen_update_sync_source",
        out = "update.sh",
        content = [
            # This depends on bash, would need tweaks for Windows
            "#!/usr/bin/env bash",
            # Bazel gives us a way to access the source folder!
            "cd $BUILD_WORKSPACE_DIRECTORY",
            # Paths are now relative to the workspace.
            # We can copy files from bazel-bin to the sources
            "cp -fv bazel-bin/{1} {0}".format(
                absolute_source_path,
                # Convert label to path
                absolute_file_label.replace(":", "/"),
            )
        ],
    )

    # This is what you can `bazel run` and it can write to the source folder
    native.sh_binary(
        name = update_label,
        srcs = ["update.sh"],
        data = [absolute_file_label],
    )
