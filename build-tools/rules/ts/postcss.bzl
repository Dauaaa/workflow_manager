def postcss(name, src, tailwind_glob, config, **kwargs):
    """
Macro for executing postcss
    """
    outs = [name + ".css"]

    native.genrule(
        name = name,
        srcs = [src] + tailwind_glob,
        outs = outs,
        cmd = """
postcss --config {config} -o $(OUTS) $(location {src})
""".format(config = config, src = src),
        **kwargs
    )
