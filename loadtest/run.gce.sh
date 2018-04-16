#!/bin/sh

# Deploy the conodes
kubectl create -f deployments.yaml

# Expose the nodes
kubectl create -f services.yaml

echo "Waiting for conode 1 to be ready"
kubectl rollout status deployment/conode1-deployment

# Extract Pin
PIN=$(kubectl logs deployment/conode1-deployment | ggrep -Po 'Pin: [\w\d]+' | awk '{print $2}')
kubectl create secret generic conode1-pin --from-literal=pin=$PIN

# Create the roster
SERVICE_COUNT=$(kubectl get services | ggrep -c conode)
for i in $(seq 1 $SERVICE_COUNT)
do
	PK=$(kubectl logs deployment/conode$i-deployment | ggrep -Po 'public key [\w\d]+' | awk '{print $3}')
	echo "Public Key: $PK"
	echo "
[[servers]]
  Address = \"tls://conode$i-service.default.svc.cluster.local:6879\"
  Suite = \"Ed25519\"
  Public = \"$PK\"
  Description = \"Conode $i\"
" >> roster.toml
done
kubectl create configmap  roster --from-file=roster.toml

# Create Master Skipchain
kubectl create -f jobs.yaml
until kubectl get jobs initiateskipchain -o jsonpath='{.status.conditions[?(@.type=="Complete")].status}' | grep True ; do sleep 1 ; done
#kubectl rollout status job/initiateskipchain

# Deploy Auth Server
MASTER_KEY=$(kubectl logs jobs/initiateskipchain | ggrep -Po '[\d\s]+(?=\])')
kubectl create secret generic auth --from-literal=MASTER_KEY="$MASTER_KEY" --from-literal=PRIVATE_KEY=3896b46cdd97522e7ddf611633614da0d6d8e8c26f1d61756051d40c6783c70c
kubectl create -f auth.yaml
kubectl rollout status deployment/auth-deployment

kubectl create configmap loadtest --from-file=vote.yaml --from-file=setup.js --from-file=proc.js
# Deploy the load testing container
kubectl create -f loadtest.yaml
