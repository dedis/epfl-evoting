#!/bin/sh

if [ "$1" = "yes" ]; then
    YES_REALLY=
    set -x -e
else
    echo "Only printing what it would do. Run with 1st arg yes to do it for real."
    echo
    YES_REALLY="echo Would:"
fi

$YES_REALLY kubectl delete deployment prod-conode
$YES_REALLY kubectl delete svc prod-conode

