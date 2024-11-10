#!/bin/sh

# execute starting from root directory
cd "$(dirname "$0")/.."

# build app
cd webapps/workflow_manager
npx vite build -m prod
cd ../../

# build image
docker build . \
    -f infra/containers/nginx_server_react/Dockerfile \
    --build-arg CONFIG_DIR=infra/containers/nginx_server_react \
    --build-arg DIST_DIR=webapps/workflow_manager/dist \
    -t registry.fly.io/workflow-manager-client

docker push registry.fly.io/workflow-manager-client

fly deploy -c infra/workflow_manager_client.toml
