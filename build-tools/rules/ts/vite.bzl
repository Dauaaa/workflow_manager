load("@aspect_rules_ts//ts:defs.bzl", "ts_project")
load("@aspect_rules_js//js:defs.bzl", "js_run_binary", "js_run_devserver")

def vite(srcs, vite_binary, build_out = "dist", **kwargs):
    name = kwargs.pop("name", None)
    build_suffix = "build"
    dev_suffix = "dev"
    if name:
        build_name = name + "_" + build_suffix
        dev_name = name + "_" + dev_suffix
    else:
        build_name = build_suffix
        dev_name = dev_suffix

    js_run_binary(
        name = build_name,
        tool = vite_binary,
        args = ["build"],
        srcs = srcs,
        out_dirs = [build_out],
        chdir = native.package_name(),
        **kwargs
    )

    js_run_devserver(
        name = dev_name,
        args = ["-m", "dev"],
        tool = vite_binary,
        data = srcs,
        chdir = native.package_name(),
    )

def vite_ts_project(srcs, assets = [], **kwargs):
    """
Wrapper around ts_project that simply copies srcs to bin

This is necessary since vite needs the ts/tsx source files.
    """
    ts_project(
        srcs = srcs,
        # trick to copy ts/tsx files to bin
        assets = assets + srcs,
        **kwargs
    )
