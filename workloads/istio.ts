import * as k8s from "@pulumi/kubernetes";

export async function deploy(provider: k8s.Provider): Promise<void> {
    // Namespace for Istio
    const istioNamespace = new k8s.core.v1.Namespace("istio-system", {
        metadata: { name: "istio-system" },
    }, { provider });

    // Istio Base
    const istioBase = new k8s.helm.v3.Chart("istio-base", {
        chart: "base",
        version: "1.24.1",
        fetchOpts: { repo: "https://istio-release.storage.googleapis.com/charts" },
        namespace: "istio-system",
    }, { provider, dependsOn: [istioNamespace] });

    // Istio Control Plane
    const istiod = new k8s.helm.v3.Chart("istiod", {
        chart: "istiod",
        version: "1.24.1",
        fetchOpts: { repo: "https://istio-release.storage.googleapis.com/charts" },
        namespace: "istio-system",
    }, { provider, dependsOn: [istioBase] });

    // Istio Ingress Gateway
    const istioIngressGateway = new k8s.helm.v3.Chart("istio-ingressgateway", {
        chart: "gateway",
        version: "1.24.1",
        fetchOpts: { repo: "https://istio-release.storage.googleapis.com/charts" },
        namespace: "istio-system",
    }, { provider, dependsOn: [istiod] });

    // Istio Egress Gateway
    const istioEgressGateway = new k8s.helm.v3.Chart("istio-egressgateway", {
        chart: "gateway",
        version: "1.24.1",
        fetchOpts: { repo: "https://istio-release.storage.googleapis.com/charts" },
        namespace: "istio-system",
        values: {
            gateways: {
                name: "istio-egressgateway",
            },
        },
    }, { provider, dependsOn: [istiod] });

    // Monitoring and Observability Add-ons
    const prometheus = new k8s.helm.v3.Chart("prometheus", {
        chart: "prometheus",
        version: "15.0.0",
        fetchOpts: { repo: "https://prometheus-community.github.io/helm-charts" },
        namespace: "istio-system",
    }, { provider });

    const grafana = new k8s.helm.v3.Chart("grafana", {
        chart: "grafana",
        version: "6.0.0",
        fetchOpts: { repo: "https://grafana.github.io/helm-charts" },
        namespace: "istio-system",
    }, { provider });

    const kiali = new k8s.helm.v3.Chart("kiali", {
        chart: "kiali-server",
        version: "1.48.0",
        fetchOpts: { repo: "https://kiali.org/helm-charts" },
        namespace: "istio-system",
    }, { provider });

    const jaeger = new k8s.helm.v3.Chart("jaeger", {
        chart: "jaeger",
        version: "0.58.0",
        fetchOpts: { repo: "https://jaegertracing.github.io/helm-charts" },
        namespace: "istio-system",
    }, { provider });

    console.log("Istio and add-ons deployed successfully.");
}
