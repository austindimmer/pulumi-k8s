import * as k8s from "@pulumi/kubernetes";

export async function deploy(provider: k8s.Provider, clusterName: string): Promise<void> {
    const istioNamespaceName = `istio-system`;

    // Namespace for Istio
    const istioNamespace = new k8s.core.v1.Namespace(istioNamespaceName, {
        metadata: { name: istioNamespaceName },
    }, { provider });

    // Istio Base
    const istioBase = new k8s.helm.v3.Chart(`istio-base-${clusterName}`, {
        chart: "base",
        version: "1.24.1",
        fetchOpts: { repo: "https://istio-release.storage.googleapis.com/charts" },
        namespace: istioNamespaceName,
        values: {
            global: {
                istioNamespace: istioNamespaceName,
            },
        },
    }, { provider, dependsOn: [istioNamespace] });

    // Istio Control Plane
    const istiod = new k8s.helm.v3.Chart(`istiod-${clusterName}`, {
        chart: "istiod",
        version: "1.24.1",
        fetchOpts: { repo: "https://istio-release.storage.googleapis.com/charts" },
        namespace: istioNamespaceName,
        values: {
            global: {
                istioNamespace: istioNamespaceName,
            },
        },
    }, { provider, dependsOn: [istioBase] });

    // Istio Ingress Gateway
    // const istioIngressGateway = new k8s.helm.v3.Chart(`istio-ingressgateway-${clusterName}`, {
    //     chart: "gateway",
    //     version: "1.24.1",
    //     fetchOpts: { repo: "https://istio-release.storage.googleapis.com/charts" },
    //     namespace: istioNamespaceName,
    //     values: {
    //         gateways: {
    //             name: `istio-ingressgateway-${clusterName}`,
    //         },
    //     },
    // }, { provider, dependsOn: [istiod] });

    // Istio Egress Gateway
    const istioEgressGateway = new k8s.helm.v3.Chart(`istio-egressgateway-${clusterName}`, {
        chart: "gateway",
        version: "1.24.1",
        fetchOpts: { repo: "https://istio-release.storage.googleapis.com/charts" },
        namespace: istioNamespaceName,
        values: {
            gateways: {
                name: `istio-egressgateway-${clusterName}`,
            },
        },
    }, { provider, dependsOn: [istiod] });

    // // Monitoring and Observability Add-ons
    // const prometheus = new k8s.helm.v3.Chart(`prometheus-${clusterName}`, {
    //     chart: "prometheus",
    //     version: "26.0.0",
    //     fetchOpts: { repo: "https://prometheus-community.github.io/helm-charts" },
    //     namespace: istioNamespaceName,
    //     values: {
    //         fullnameOverride: `prometheus-${clusterName}`, // Ensure unique names
    //     },
    // }, { provider });

    // const grafana = new k8s.helm.v3.Chart(`grafana-${clusterName}`, {
    //     chart: "grafana",
    //     version: "8.6.4",
    //     fetchOpts: { repo: "https://grafana.github.io/helm-charts" },
    //     namespace: istioNamespaceName,
    //     values: {
    //         fullnameOverride: `prometheus-${clusterName}`, // Ensure unique names
    //     },
    // }, { provider });

    // const kiali = new k8s.helm.v3.Chart(`kiali-${clusterName}`, {
    //     chart: "kiali-server",
    //     version: "2.2.0",
    //     fetchOpts: { repo: "/" },
    //     namespace: istioNamespaceName,
    //     values: {
    //         fullnameOverride: `kiali-${clusterName}`, // Ensure unique names
    //     },
    // }, { provider });

    // const jaeger = new k8s.helm.v3.Chart(`jaeger-${clusterName}`, {
    //     chart: "jaeger",
    //     version: "3.3.3",
    //     fetchOpts: { repo: "https://jaegertracing.github.io/helm-charts" },
    //     namespace: istioNamespaceName,
    //     values: {
    //         fullnameOverride: `prometheus-${clusterName}`, // Ensure unique names
    //     },
    // }, { provider });

    console.log("Istio and add-ons deployed successfully.");
}
