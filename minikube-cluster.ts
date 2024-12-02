import * as k8s from "@pulumi/kubernetes";

// Use the local kubeconfig for Minikube.
const provider = new k8s.Provider("minikube", {
    kubeconfig: process.env.KUBECONFIG || "~/.kube/config",
});

// Deploy a simple namespace as a test.
const testNamespace = new k8s.core.v1.Namespace("test-namespace", {
    metadata: { name: "test-namespace" },
}, { provider });

export const minikubeProvider = provider;
