// import * as pulumi from "@pulumi/pulumi";
// import * as localCluster from "./minikube-cluster";
// // import * as awsCluster from "./eks-cluster";
// // import * as securityTools from "./security-tools";
// import * as istio from "./istio";
// // import * as argocd from "./argocd";
// // import * as crossplane from "./crossplane";
// // import * as kubeflow from "./kubeflow";

// // Get the current stack name.
// const stack = pulumi.getStack();

// // Conditional deployment based on the stack.
// if (stack === "minikube") {
//     console.log("Deploying to Minikube...");
//     localCluster; // Minikube cluster setup.
//     // securityTools; // Security tools for Minikube.
//     istio;         // Istio deployment for Minikube.
//     // argocd;        // ArgoCD deployment for Minikube.
//     // crossplane;    // Crossplane deployment for Minikube.
//     // kubeflow;      // Kubeflow deployment for Minikube.
// } else if (stack === "aws") {
//     console.log("Deploying to AWS...");
//     // awsCluster; // EKS cluster setup.
//     // securityTools; // Security tools for AWS.
//     istio;         // Istio deployment for AWS.
//     // argocd;        // ArgoCD deployment for AWS.
//     // crossplane;    // Crossplane deployment for AWS.
//     // kubeflow;      // Kubeflow deployment for AWS.
// } else {
//     throw new Error(`Unknown stack: ${stack}. Valid stacks are "minikube" or "aws".`);
// }


import * as pulumi from "@pulumi/pulumi";
import * as localCluster from "./minikube-cluster";

const stack = pulumi.getStack();

if (stack === "minikube") {
    console.log("Deploying to Minikube...");
    const provider = localCluster.provider;

    // Import and deploy Istio
    import("./istio").then((istio) => {
        console.log("Istio deployed to Minikube.");
    });
    import("./security-tools").then((securityTools) => {
        console.log("Security tools deployed to Minikube.");
    });
    import("./argocd").then((argocd) => {
        console.log("ArgoCD deployed to Minikube.");
    });
    // import("./crossplane").then((crossplane) => {
    //     console.log("Crossplane deployed to Minikube.");
    // });
    // import("./kubeflow").then((kubeflow) => {
    //     console.log("Kubeflow deployed to Minikube.");
    // });
} else if (stack === "aws") {
    console.log("Deploying to AWS...");

    // AWS-specific setup, e.g., EKS
} else {
    throw new Error(`Unknown stack: ${stack}. Valid stacks are "minikube" or "aws".`);
}

