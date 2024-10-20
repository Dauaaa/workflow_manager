# postgres.bzl

load("@bazel_skylib//rules:common_settings.bzl", "string_flag")

def _postgres_server_impl(ctx):
    """
    Implementation of a custom Bazel rule to manage a PostgreSQL server.
    
    This rule starts a PostgreSQL server on a dynamically assigned port
    and ensures that the server is stopped after the build phase. The 
    port is written to {name}_pg_info together with username, password and
    database. {name}_pg_info_java.properties is similar but with java properites
    setting the database of spring boot jpa.

    Args:
        ctx: The context of the Bazel rule which provides access to actions,
             attributes, and other Bazel functionalities.
    """

    datadir_name = ctx.label.package + "/" + ctx.label.name + "_pg_datadir_name"
    info_file_name = ctx.label.name + "_pg_info"
    java_properties_file_name = ctx.label.name + "_pg_info_java.properties"

    datadir = ctx.actions.declare_directory(ctx.label.name + "_pg_datadir_name")
    info_file = ctx.actions.declare_file(info_file_name)
    java_properties_file = ctx.actions.declare_file(java_properties_file_name)

    username = "postgres"
    password = "postgres"
    database = "postgres"
    
    # Write pg server data to the info files
    ctx.actions.run_shell(
        outputs=[datadir, info_file, java_properties_file],
        command="""
        rm -r "${{$(pwd)}}/{datadir_name}" 
        initdb -D "${{$(pwd)}}/{datadir_name}" 
        pg_ctl -D {datadir_name} -o '-p 0' start
        sleep 1
        PID=$(ps -ef | grep {datadir_name} | head -n 1 | awk '{{print $2}}')
        PORT=$(lsof -Pan -p $PID -i | grep postgres | grep 127.0.0.1 | awk '{{print $9}}' | cut -d ":" -f 2)
        echo "USER={username}" > {info_file_name}
        echo "PASSWORD={password}" >> {info_file_name}
        echo "DATABASE={database}" >> {info_file_name}
        echo "PORT=$PORT" >> {info_file_name}
        echo "database={database}" > {java_properties_file_name}
        echo "spring.datasource.url=postgres://127.0.0.1:${{PORT}}" >> {java_properties_file_name}
        echo "spring.datasource.username={username}" >> {java_properties_file_name}
        echo "spring.datasource.password={password}" >> {java_properties_file_name}
        echo "PORT=$PORT" >> {java_properties_file_name}
        """.format(
            datadir_name = datadir_name,
            database = database,
            password = password, 
            username = username, 
            info_file_name = info_file_name,
            java_properties_file_name = java_properties_file_name),
    )

postgres_server = rule(
    implementation=_postgres_server_impl,
)

def _shutdown_postgres_server_impl(ctx):
    datadir_name = ctx.label.package + "/" + ctx.label.name + "_pg_datadir_name"

#     # Register a cleanup action to stop the PostgreSQL server
#     ctx.actions.run_shell(
#             command="""
# pg_ctl -D {datadir_name} stop
# rm -r {datadir_name}
# """.format(datadir_name = datadir_name),
#             outputs=[datadir_name],
#         )


shutdown_postgres_server = rule(
    implementation=_shutdown_postgres_server_impl,
    attrs = {
        "postgres_server": attr.label(mandatory = True),
        "after": attr.label(mandatory = True),
    }
)
