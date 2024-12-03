import * as awsx from "@pulumi/awsx";
import * as eks from "@pulumi/eks";
import * as azure from "@pulumi/azure-native";
import * as k8s from "@pulumi/kubernetes";
import * as command from "@pulumi/command";
import * as pulumi from "@pulumi/pulumi";
import * as securityTools from "./security-tools";

// Interfaces for cluster configuration
export interface IClusterConfig {
    name: string;
    provider: "minikube" | "eks" | "aks";
    enableSecurityTools?: boolean;
}

export interface IMinikubeClusterConfig extends IClusterConfig {
    numberOfCpus: number;
    memory: string;
    metalLbRange: string;
}

export interface IEksClusterConfig extends IClusterConfig {
    desiredCapacity: number;
    instanceType: string;
    minSize: number;
    maxSize: number;
}

export interface IAksClusterConfig extends IClusterConfig {
    vmSize: string;
    nodeCount: number;
}

// BaseCluster Class
export class BaseCluster {
    name: string;
    provider: k8s.Provider;

    constructor(config: IClusterConfig) {
        this.name = config.name;

        switch (config.provider) {
            case "minikube":
                this.provider = this.createMinikubeCluster(config as IMinikubeClusterConfig);
                break;
            case "eks":
                this.provider = this.createEksCluster(config as IEksClusterConfig);
                break;
            case "aks":
                this.provider = this.createAksCluster(config as IAksClusterConfig);
                break;
            default:
                throw new Error(`Unsupported provider: ${config.provider}`);
        }

        if (config.enableSecurityTools) {
            this.deploySecurityTools();
        }
    }

    private createMinikubeCluster(config: IMinikubeClusterConfig): k8s.Provider {
        console.log(`Creating Minikube cluster: ${config.name}`);

        const startMinikube = new command.local.Command("startMinikube", {
            create: `if ! minikube status --output=json | grep -q '"Running"'; then minikube start --cpus=${config.numberOfCpus} --memory=${config.memory}; fi`,
            delete: "minikube delete",
            triggers: [config.numberOfCpus, config.memory],
        });

        const initializeMetalLB = new command.local.Command("initializeMetalLB", {
            create: `minikube addons enable metallb`,
            delete: `minikube addons disable metallb`,
            triggers: [startMinikube],
        }, { dependsOn: startMinikube });

        const configureMetalLB = new command.local.Command("configureMetalLB", {
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
      - ${config.metalLbRange}
EOF
`,
            delete: `kubectl delete configmap config -n metallb-system`,
        }, { dependsOn: initializeMetalLB });

        return new k8s.Provider(`${config.name}-provider`, {
            kubeconfig: process.env.KUBECONFIG || "~/.kube/config",
        }, { dependsOn: [startMinikube, configureMetalLB] });
    }

    private createEksCluster(config: IEksClusterConfig): k8s.Provider {
        console.log(`Creating EKS cluster: ${config.name}`);

        const vpc = new awsx.ec2.Vpc(`${config.name}-vpc`, {
            cidrBlock: "10.0.0.0/16",
        });

        const eksCluster = new eks.Cluster(config.name, {
            vpcId: vpc.id,
            subnetIds: vpc.privateSubnetIds,
            desiredCapacity: config.desiredCapacity,
            minSize: config.minSize,
            maxSize: config.maxSize,
            instanceType: config.instanceType,
        });

        return new k8s.Provider(`${config.name}-provider`, {
            kubeconfig: eksCluster.kubeconfig.apply(JSON.stringify),
        });
    }

    private createAksCluster(config: IAksClusterConfig): k8s.Provider {
        console.log(`Creating AKS cluster: ${config.name}`);

        const resourceGroup = new azure.resources.ResourceGroup(`${config.name}-rg`);

        const aksCluster = new azure.containerservice.ManagedCluster(config.name, {
            resourceGroupName: resourceGroup.name,
            agentPoolProfiles: [
                {
                    name: "agentpool",
                    count: config.nodeCount,
                    vmSize: config.vmSize,
                },
            ],
            dnsPrefix: `${config.name}-dns`,
            enableRBAC: true,
        });

        const kubeconfig = aksCluster.kubeConfigRaw.apply((kubeconfig) => kubeconfig);

        return new k8s.Provider(`${config.name}-provider`, { kubeconfig });
    }

    private deploySecurityTools(): void {
        console.log(`Deploying security tools to cluster: ${this.name}`);
        securityTools.deploy(this.provider).then(() => {
            console.log("Security tools deployed successfully.");
        }).catch((error) => {
            console.error("Failed to deploy security tools:", error);
        });
    }
}
