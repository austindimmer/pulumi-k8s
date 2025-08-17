# Check SSH connectivity to Minikube
nc -zv localhost 2222

# Check Kubernetes API connectivity
nc -zv localhost 8443

# Check Minikube status
minikube status --profile minikube-kubeflow
