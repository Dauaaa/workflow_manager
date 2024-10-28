def java_open_api_gen(name, java_bin, **kwargs):
    """
Macro for generating java open api.

This macro sends request to path `GET /v3/api-docs.yaml` to get the OpenAPI schema.

Output is named like java_bin + "_open_api.yaml"
    """

    native.genrule(
        name = name,
        # wrapper script for running the application has same name as label
        srcs = [java_bin],
        outs = [java_bin + "_open_api.yaml"],
        # TODO: getting the Tomcat output is devilishly delicate don't care for now
        cmd = """
# remove .jar files that might come with the target
# reusing generated file to simplify cmd
$$(echo $(locations {java_bin}) | sed 's/\\.jar//g' | sed 's/\\s/\\n/g' | uniq) --server.port=0 > $@ &
sleep 5
# get port from process stdout
PORT="$$(sed -n 's/.*Tomcat started on port \\([0-9]*\\).*/\\1/p' $@)"
# unlink $@, the process will still send its output to its current fd
# but after $@ is created again it reference a different inode
rm $@
# set $@ value using return from interface
curl "http://localhost:$${PORT}/v3/api-docs.yaml" > $@
kill %1
""".format(
        java_bin = java_bin,
        PORT = "{PORT}" # XD,
    ),
        tools = [java_bin],
        **kwargs
    )
