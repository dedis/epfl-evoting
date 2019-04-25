#!/bin/sh

kubectl create -f all.yaml

echo "Waiting for conode to be ready"
kubectl rollout status deployments/prod-conode
