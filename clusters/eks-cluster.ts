import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import { IEksClusterConfig } from "../types/interfaces";

export class EksCluster {
    provider: eks.Provider;

    constructor(config: IEksClusterConfig) {
        const vpc = new aws.ec2.Vpc(`${config.name}-vpc`, { cidrBlock: "10.0.0.0/16" });

        const cluster = new eks.Cluster(config.name, {
            vpcId: vpc.id,
            // subnetIds: vpc.subnetIds,
            instanceType: config.instanceType,
            desiredCapacity: config.desiredCapacity,
            minSize: config.minSize,
            maxSize: config.maxSize,
        });

        this.provider = cluster.provider;
    }
}
