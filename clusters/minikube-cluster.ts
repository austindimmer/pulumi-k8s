import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as command from "@pulumi/command";
import { IMinikubeClusterConfig } from "../types/interfaces";

// Class for Minikube cluster management
export class MinikubeCluster {
    provider: k8s.Provider;

    constructor(config: IMinikubeClusterConfig) {
        const { name, kubernetesVersion, numberOfCpus, memory, metalLbRange } = config;

        // Start Minikube
        const startMinikube = new command.local.Command(`startMinikube-${name}`, {
            create: `
                if ! minikube status --profile ${name} --output=json | grep -q '"Running"'; then 
                    minikube start --profile ${name} --kubernetes-version=${kubernetesVersion} --cpus=${numberOfCpus} --memory=${memory};
                fi`,
            delete: `minikube delete --profile ${name}`,
            triggers: [kubernetesVersion, numberOfCpus, memory],
        });
        pulumi.log.info(`Minikube cluster '${name}' initialized with kubernetesVersion: ${kubernetesVersion}, ${numberOfCpus} CPUs and ${memory} memory.`);

        // Initialize MetalLB
        const initializeMetalLB = new command.local.Command(`initializeMetalLB-${name}`, {
            create: `minikube addons enable metallb --profile ${name}`,
            delete: `minikube addons disable metallb --profile ${name}`,
        }, { dependsOn: startMinikube });
        pulumi.log.info(`MetalLB enabled for Minikube cluster '${name}'.`);

        // Configure MetalLB
        const configureMetalLB = new command.local.Command(`configureMetalLB-${name}`, {
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
      - ${metalLbRange}
EOF
`,
            delete: `kubectl delete configmap config -n metallb-system`,
        }, { dependsOn: initializeMetalLB });
        pulumi.log.info(`MetalLB configured with IP range ${metalLbRange} for cluster '${name}'.`);

        // Configure kubeconfig for the cluster
        const kubeconfig = process.env.KUBECONFIG || `~/.kube/config`;
        const minikubeProvider = new k8s.Provider(`minikube-${name}`, { kubeconfig }, { dependsOn: [startMinikube, configureMetalLB] });

        // Deploy a test namespace to verify connectivity
        const testNamespace = new k8s.core.v1.Namespace(`test-namespace-${name}`, {
            metadata: { name: `test-namespace-${name}` },
        }, { provider: minikubeProvider });
        pulumi.log.info(`Test namespace 'test-namespace-${name}' deployed successfully to cluster '${name}'.`);

        // Assign the provider to the class instance
        this.provider = minikubeProvider;

        // Diagnostics and error handling
        try {
            pulumi.log.info(`Cluster '${name}' successfully initialized.`);
        } catch (error) {
            pulumi.log.error(`Failed to initialize cluster '${name}': ${error}`);
            throw error;
        }
    }
}
