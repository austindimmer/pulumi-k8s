import * as k8s from "@pulumi/kubernetes";

// Namespace for Istio
const istioNamespace = new k8s.core.v1.Namespace("istio-system", {
    metadata: { name: "istio-system" },
}, { customTimeouts: { create: "5m" } }); // Extend timeout for namespace creation if needed

// Wait for the namespace to be fully ready
const namespaceReady = new k8s.core.v1.Namespace("namespace-ready", {
    metadata: { name: "istio-system" },
}, { dependsOn: [istioNamespace] });

// Istio Base
const istioBase = new k8s.helm.v3.Chart("istio-base", {
    chart: "base",
    version: "1.24.1",
    fetchOpts: { repo: "https://istio-release.storage.googleapis.com/charts" },
    namespace: "istio-system",
}, { 
    dependsOn: [namespaceReady],
    transformations: [
        (obj: any) => {
            if (obj.kind === "ValidatingWebhookConfiguration" && obj.metadata.name === "istiod-default-validator") {
                console.log("Excluding ValidatingWebhookConfiguration:", obj.metadata.name);
                return null; // Exclude this resource
            }
            return obj;
        },
    ],
});

// Istio Control Plane
const istiod = new k8s.helm.v3.Chart("istio-control-plane", {
    chart: "istiod",
    version: "1.24.1",
    fetchOpts: { repo: "https://istio-release.storage.googleapis.com/charts" },
    namespace: "istio-system",
}, { 
    dependsOn: [istioBase],
    transformations: [
        (obj: any) => {
            if (obj.kind === "Deployment" && obj.metadata.name === "istiod") {
                console.log("Customizing istiod deployment");
                obj.spec.replicas = 2; // Adjust replica count for testing
            }
            return obj;
        },
    ],
});

// Istio Gateway
const istioGateway = new k8s.helm.v3.Chart("istio-gateway", {
    chart: "gateway",
    version: "1.24.1",
    fetchOpts: { repo: "https://istio-release.storage.googleapis.com/charts" },
    namespace: "istio-system",
}, { 
    dependsOn: [istiod],
    transformations: [
        (obj: any) => {
            if (obj.kind === "Service" && obj.metadata.name === "istio-ingressgateway") {
                console.log("Configuring Istio Gateway service:", obj.metadata.name);
                obj.spec.type = "NodePort"; // Adjust service type for Minikube
            }
            return obj;
        },
    ],
});

export { istioNamespace, istioBase, istiod, istioGateway };
