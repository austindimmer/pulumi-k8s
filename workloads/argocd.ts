import * as k8s from "@pulumi/kubernetes";

export function deploy(provider: k8s.Provider): Promise<void> {
    console.log("Deploying ArgoCD...");

    const argoNamespace = new k8s.core.v1.Namespace("argocd", {
        metadata: { name: "argocd" },
    }, { provider });

    new k8s.helm.v3.Chart("argocd", {
        chart: "argo-cd",
        version: "7.7.7",
        fetchOpts: { repo: "https://argoproj.github.io/argo-helm" },
        namespace: "argocd",
        values: {
            server: {
                service: {
                    type: "LoadBalancer",
                },
            },
        },
    }, { provider, dependsOn: [argoNamespace] });

    return Promise.resolve();
}
