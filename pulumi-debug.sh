#!/bin/bash
export NODE_OPTIONS='--inspect-brk=127.0.0.1:9292'
pulumi login
pulumi stack select minikube-argocd
pulumi up -f
