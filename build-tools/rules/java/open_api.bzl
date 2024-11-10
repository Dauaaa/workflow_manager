def java_open_api_gen(name, java_bin, resources = [], **kwargs):
    """
Macro for generating java open api.

This macro sends request to path `GET /v3/api-docs.yaml` to get the OpenAPI schema.

Output is named like java_bin + "_open_api.yaml"
    """

    native.genrule(
        name = name,
        # wrapper script for running the application has same name as label
        srcs = resources,
        outs = [java_bin + "_open_api.yaml"],
        cmd = """
# remove .jar files that might come with the target
# reusing generated file to simplify cmd
$$(echo $(locations {java_bin}) | sed 's/\\.jar//g' | sed 's/\\s/\\n/g' | uniq) --server.port=0 --spring.profiles.active=openapi > /dev/null &
PID=$$!
sleep 10
# get port using PID and getting port the process is listening to. It should only be one so OK!
PORT=$$(lsof -Pan -p $$PID -i | grep LISTEN | awk '{{print $$9}}' | cut -d ":" -f 2)
# set $@ value using return from API
curl "http://localhost:$${PORT}/v3/api-docs.yaml" > $@
kill %1
""".format(
        java_bin = java_bin,
        PORT = "{PORT}" # XD,
    ),
        tools = [java_bin],
        **kwargs
    )
