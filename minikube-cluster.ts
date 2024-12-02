import * as k8s from "@pulumi/kubernetes";
import * as command from "@pulumi/command";

// Configuration for Minikube
const cpus = 4; // Number of CPUs to allocate
const memory = 8192; // Memory in MB to allocate

// Ensure Minikube is started with the required resources
export const startMinikube = new command.local.Command("startMinikube", {
    create: `if ! minikube status --output=json | grep -q '"Running"'; then minikube start --cpus=${cpus} --memory=${memory}; fi`,
    delete: "minikube delete",
    triggers: [cpus, memory], // Trigger on resource configuration changes
});

// Initialize MetalLB
export const initializeMetalLB = new command.local.Command("initializeMetalLB", {
    create: `minikube addons enable metallb`,
    delete: `minikube addons disable metallb`,
    triggers: [startMinikube],
}, { dependsOn: startMinikube });

// Set up MetalLB IP Address Range
export const configureMetalLB = new command.local.Command("configureMetalLB", {
    create: `kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  namespace: metallb-system
  name: config
data:
  config: |
    address-pools:
    - name: default
      protocol: layer2
      addresses:
      - 192.168.49.240-192.168.49.250
EOF
`,
    delete: `kubectl delete configmap config -n metallb-system`,
}, { dependsOn: initializeMetalLB });

// Use the local kubeconfig for Minikube, ensuring the cluster is started
export const minikubeProvider = new k8s.Provider("minikube", {
    kubeconfig: process.env.KUBECONFIG || "~/.kube/config",
}, { dependsOn: [startMinikube, configureMetalLB] });

// Deploy a simple namespace as a test
const testNamespace = new k8s.core.v1.Namespace("test-namespace", {
    metadata: { name: "test-namespace" },
}, { provider: minikubeProvider });

export const provider = minikubeProvider;
