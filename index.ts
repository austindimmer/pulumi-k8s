import * as pulumi from "@pulumi/pulumi";
import * as localCluster from "./minikube-cluster";
// import * as awsCluster from "./eks-cluster.ts1";
import * as securityTools from "./security-tools";

// Get the current stack name.
const stack = pulumi.getStack();

// Conditional deployment based on the stack.
if (stack === "minikube") {
    // Deploy Minikube cluster and tools.
    localCluster; // Minikube cluster setup.
    securityTools; // Security tools for Minikube.
} else if (stack === "aws") {
    // Deploy EKS cluster and tools.
    // awsCluster; // EKS cluster setup.
    securityTools; // Security tools for AWS.
} else {
    throw new Error(`Unknown stack: ${stack}. Valid stacks are "minikube" or "aws".`);
}
