import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";

// Create an EKS cluster.
const cluster = new eks.Cluster("eks-cluster", {
    desiredCapacity: 2,
    minSize: 2,
    maxSize: 5,
    instanceType: "t3.medium",
});

// Export kubeconfig for the EKS cluster.
export const eksKubeconfig = cluster.kubeconfig;
