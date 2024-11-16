#!/bin/sh

# execute starting from root directory
cd "$(dirname "$0")/.."

bazel build //services/workflow_manager

docker load < bazel-bin/services/ws_workflow_manager/ws_workflow_manager_deployment_container/tarball.tar
docker tag ws_workflow_manager_deployment:latest registry.fly.io/ws-workflow-manager

docker push registry.fly.io/ws-workflow-manager

fly deploy -c infra/ws_workflow_manager.toml
