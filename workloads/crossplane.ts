import * as k8s from "@pulumi/kubernetes";

export function deploy(provider: k8s.Provider): Promise<void> {
    console.log("Deploying Crossplane...");

    const crossplaneNamespace = new k8s.core.v1.Namespace("crossplane-system", {
        metadata: { name: "crossplane-system" },
    }, { provider });

    new k8s.helm.v3.Chart("crossplane", {
        chart: "crossplane",
        version: "1.18.1",
        fetchOpts: { repo: "https://charts.crossplane.io/stable" },
        namespace: "crossplane-system",
    }, { provider, dependsOn: [crossplaneNamespace] });

    return Promise.resolve();
}
