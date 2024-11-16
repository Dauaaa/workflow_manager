#!/bin/sh

# execute starting from root directory
cd "$(dirname "$0")/.."

bazel build //services/workflow_manager

docker load < bazel-bin/services/workflow_manager/workflow_manager_deployment_container/tarball.tar
docker tag workflow_manager_deployment:latest registry.fly.io/workflow-manager

docker push registry.fly.io/workflow-manager

fly deploy -c infra/workflow_manager.toml
