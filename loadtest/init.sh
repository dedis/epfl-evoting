#!/bin/bash

TIMESTAMP=$(date +%s)

node /etc/loadtest/setup.js
./node_modules/.bin/artillery run -o "/mnt/dedis/$TIMESTAMP" /etc/loadtest/vote.yaml
./node_modules/.bin/artillery report "/mnt/dedis/$TIMESTAMP"
