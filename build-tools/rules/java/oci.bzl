load("@aspect_bazel_lib//lib:tar.bzl", "tar")
load("@rules_oci//oci:defs.bzl", "oci_image", "oci_tarball")

def springboot_oci(name, package_name):
    tar(
        name = name + "_layer",
        srcs = [name + ".jar"],
    )

    oci_image(
        name = name + "_image",
        base = "@distroless_java",
        entrypoint = [
            "java",
            "-jar",
            "/" + package_name + "/" + name + ".jar",
        ],
        tars = [":" + name + "_layer"],
    )

    oci_tarball(
        name = name + "_container",
        image = ":" + name + "_image",
        repo_tags = [
            name + ":latest",
        ],
    )
