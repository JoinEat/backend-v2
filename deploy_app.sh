#!/bin/bash
########################################
# Put this on a Server
# run chmod +x deploy_app.sh to make the script executable
# 
# Execute this script:  ./deploy_app.sh ariv3ra/python-circleci-docker:$TAG
# Replace the $TAG with the actual Build Tag you want to deploy
#
########################################

set -e

DOCKER_IMAGE=$1
CONTAINER_NAME="api-server"

# Check for arguments
if [[ $# -lt 1 ]] ; then
    echo '[ERROR] You must supply a Docker Image to pull'
    exit 1
fi

docker pull $DOCKER_IMAGE

echo "Deploying Hello World to Docker Container"

#Check for running container & stop it before starting a new one
if [ $(docker inspect -f '{{.State.Running}}' $CONTAINER_NAME) == "true" ]; then
    docker stop $CONTAINER_NAME
fi

echo "Starting Hello World using Docker Image name: $DOCKER_IMAGE"

docker run -d --rm=true -p 8888:8080 -v $HOME/secret/when2eat/.env:/app/.env --name $CONTAINER_NAME $DOCKER_IMAGE

docker ps -a