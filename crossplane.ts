import * as k8s from "@pulumi/kubernetes";

// Namespace for Crossplane
const crossplaneNamespace = new k8s.core.v1.Namespace("crossplane-system", {
    metadata: { name: "crossplane-system" },
});

// Install Crossplane using Helm
const crossplane = new k8s.helm.v3.Chart("crossplane", {
    chart: "crossplane",
    version: "1.18.1", // Replace with the desired version
    fetchOpts: { repo: "https://charts.crossplane.io/stable" },
    namespace: crossplaneNamespace.metadata.name,
});

export { crossplaneNamespace, crossplane };
