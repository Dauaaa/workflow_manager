load("@aspect_rules_js//js:defs.bzl", "js_run_binary")
load("@npm//:postcss-cli/package_json.bzl", postcss_cli = "bin")

def tailwind(name, srcs, css_files, postcss_config = "postcss.config.mjs", output_file = "tailwind.css"):
    """
Macro for defining tailwind

# how to get postcss-cli:
load("@npm//:postcss-cli/package_json.bzl", postcss_cli = "bin")
    """

    postcss_command_name = name + "_postcss_binary"

    postcss_cli.postcss_binary(
        name = postcss_command_name,
        fixed_args = css_files + [
            "--config",
            postcss_config,
            "-o",
            output_file,
        ],
        chdir = native.package_name(),
    )

    js_run_binary(
        name = name,
        tool = postcss_command_name,
        srcs = srcs,
        chdir = native.package_name(),
        outs = [output_file],
    )
