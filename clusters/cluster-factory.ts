import * as pulumi from "@pulumi/pulumi";
import { MinikubeCluster } from "./minikube-cluster";
import { EksCluster } from "./eks-cluster";
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
