## Loadtesting evoting using Kubernetes

### File descriptions

* `run.sh` and `run.gce.sh` should be used to start the loadtest on ICCluster and
Google Cloud Engine respectively. If you're using GCE you'll have to comment out
 the default hostname in `setup.js`, and `vote.yaml` and replace them with the GCE ones (commented out by default)
* `deployments.yaml` describes the conode deployments.
Each conode is a separate deployment and we have 7 such entries in the file.
Update the image key to use a different container image for the deployments
* `services.yaml` exposes the conodes externally so that other containers can
interact with them using KubeDNS
* `jobs.yaml` is used to create a one off job to initiate the master skipchain
* `auth.yaml` is used to run the NodeJS authentication server with `NODE_ENV=test`.
* `loadtest.yaml` is used to spawn a container having a node environment with
`artillery`, `@dedis/cothority`, `@dedis/kyber-js`, `artillery-engine-cothority`
installed. By default it runs `init.sh` after being created which reads the
artillery script `vote.yaml` and writes the logs to `/mnt/dedis/$TIMESTAMP.html`.
`/mnt/dedis` is the persistant volume claim configured in `loadtest.yaml`. To
retrieve the file, create a busybox deployment (`kubectl create -f busybox.yaml`).
You may then use `kubectl cp <pod-name>:/mnt/dedis/$TIMESTAMP.html <dest>` to copy
the file over. The filename can be figured out by:

```
kubectl exec -it <pod-name> -- /bin/ash
ls -al /mnt/dedis/ # last file here
```


