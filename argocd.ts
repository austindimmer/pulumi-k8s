import * as k8s from "@pulumi/kubernetes";

// Namespace for ArgoCD
const argoNamespace = new k8s.core.v1.Namespace("argocd", {
    metadata: { name: "argocd" },
});

// Install ArgoCD using Helm
const argoCD = new k8s.helm.v3.Chart("argocd", {
    chart: "argo-cd",
    version: "7.7.7", // Replace with the desired version
    fetchOpts: { repo: "https://argoproj.github.io/argo-helm" },
    namespace: argoNamespace.metadata.name,
    values: {
        server: {
            service: {
                type: "LoadBalancer",
            },
        },
    },
});

export { argoNamespace, argoCD };
