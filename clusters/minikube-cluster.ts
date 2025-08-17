import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as command from "@pulumi/command";
import { IMinikubeClusterConfig } from "../types/interfaces";

export class MinikubeCluster {
    provider: k8s.Provider;

    constructor(config: IMinikubeClusterConfig) {
        const { name, kubernetesVersion, numberOfCpus, memory, metalLbRange } = config;

        // Set fixed SSH and API ports
        const sshPort = 2222; // Fix SSH port to 2222 (avoid randomness)
        const apiServerPort = 8443; // Fix API server port

        // Start Minikube with fixed ports
        const startMinikube = new command.local.Command(`startMinikube-${name}`, {
            create: `
                if ! minikube status --profile ${name} --output=json | grep -q '"Running"'; then
                    minikube start \
                        --profile ${name} \
                        --driver=docker \
                        --kubernetes-version=${kubernetesVersion} \
                        --cpus=${numberOfCpus} \
                        --memory=${memory} \
                        --ports=${sshPort}:22 --ports=${apiServerPort}:${apiServerPort} \
                        --apiserver-port=${apiServerPort} \
                        --apiserver-ips=0.0.0.0;
                fi`,
            delete: `minikube delete --profile ${name}`,
            triggers: [kubernetesVersion, numberOfCpus, memory, sshPort, apiServerPort],
        });

        const connectDevToMinikubeNet = new command.local.Command(`connect-net-${name}`, {
            create: `
                if docker network inspect minikube >/dev/null 2>&1; then
                    # HOSTNAME is the running container's name in Docker
                    docker network connect minikube "$HOSTNAME" 2>/dev/null || true
                fi
            `
        }, { dependsOn: startMinikube });

        pulumi.log.info(`Minikube cluster '${name}' initialized with Kubernetes ${kubernetesVersion}, ${numberOfCpus} CPUs, ${memory} memory.`);

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
