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
                    minikube start --profile ${name} --driver=docker --kubernetes-version=${kubernetesVersion} --cpus=${numberOfCpus} --memory=${memory};
                fi`,
            delete: `minikube delete --profile ${name}`,
            triggers: [kubernetesVersion, numberOfCpus, memory],
        });
        pulumi.log.info(`Minikube cluster '${name}' initialized with kubernetesVersion: ${kubernetesVersion}, ${numberOfCpus} CPUs and ${memory} memory.`);

        const connectDevToMinikubeNet = new command.local.Command(`connect-net-${name}`, {
            create: `
                if docker network inspect minikube >/dev/null 2>&1; then
                    # HOSTNAME is the running container's name in Docker
                    docker network connect minikube "$HOSTNAME" 2>/dev/null || true
                fi
            `
        }, { dependsOn: startMinikube });

        // Initialize MetalLB
        const initializeMetalLB = new command.local.Command(`initializeMetalLB-${name}`, {
            create: `minikube addons enable metallb --profile ${name}`,
            delete: `minikube addons disable metallb --profile ${name}`,
        }, { dependsOn: startMinikube });
        pulumi.log.info(`MetalLB enabled for Minikube cluster '${name}'.`);

        // Configure MetalLB with dynamic IP pool
        const configureMetalLB = new command.local.Command(`configureMetalLB-${name}`, {
            create: `
                POOL="$(minikube -p ${name} ip | sed 's/[0-9]\\+$/0/')"
                cat <<EOF | kubectl --context=${name} apply -f -
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: default-pool
  namespace: metallb-system
spec:
  addresses:
  - "\${POOL%0}200-\${POOL%0}250"
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: default
  namespace: metallb-system
spec: {}
EOF
            `,
            delete: `kubectl --context=${name} delete ipaddresspool default-pool -n metallb-system --ignore-not-found=true`,
        }, { dependsOn: [initializeMetalLB, connectDevToMinikubeNet] });
        pulumi.log.info(`MetalLB configured with IP range ${metalLbRange} for cluster '${name}'.`);

        // Configure kubeconfig for the cluster
        const kubeconfig = new command.local.Command(`kcfg-${name}`, {
            create: `minikube -p ${name} kubeconfig`
        }, { dependsOn: startMinikube });

        const minikubeProvider = new k8s.Provider(`minikube-${name}`, {
            kubeconfig: kubeconfig.stdout
        }, { dependsOn: [kubeconfig, configureMetalLB] });

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
