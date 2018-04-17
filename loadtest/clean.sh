#!/bin/sh

kubectl delete deployments conode1-deployment conode2-deployment conode3-deployment conode4-deployment conode5-deployment conode6-deployment conode7-deployment
kubectl delete services conode1-service conode2-service conode3-service conode4-service conode5-service conode6-service conode7-service
kubectl delete secrets conode1-pin
kubectl delete configmap roster
rm roster.toml
kubectl delete jobs initiateskipchain
kubectl delete secrets auth
kubectl delete deployments auth-deployment
kubectl delete services auth-service
kubectl delete configmap loadtest
kubectl delete jobs loadtest
