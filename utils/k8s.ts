import * as pulumi from "@pulumi/pulumi";
import { MinikubeCluster } from "../clusters/minikube-cluster";
import { EksCluster } from "../clusters/eks-cluster";
import { IClusterConfig, IMinikubeClusterConfig, IEksClusterConfig } from "../types/interfaces";

export function createCluster(config: IClusterConfig): pulumi.ProviderResource {
    switch (config.provider) {
        case "minikube":
            return new MinikubeCluster(config as IMinikubeClusterConfig).provider;
        case "eks":
            return new EksCluster(config as IEksClusterConfig).provider;

        default:
            throw new Error(`Unsupported provider: ${config.provider}`);
    }
}



export async function deployWorkloads(
    provider: pulumi.ProviderResource,
    clusterName: string,
    workloadList: string[]
): Promise<void> {
    for (const workload of workloadList) {
        const module = await import(`../workloads/${workload}`);
        await module.deploy(provider, clusterName);
        console.log(`${workload} deployed to ${clusterName} successfully.`);
    }
}

