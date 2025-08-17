// import * as pulumi from "@pulumi/pulumi";
// import * as command from "@pulumi/command";
// import { createCluster } from "./clusters/cluster-factory";
// import { IMinikubeClusterConfig, IEksClusterConfig } from "./types/interfaces";
// import { deployWorkloads } from "./utils/k8s";
// import { exec } from "child_process";
// import { promisify } from "util";

// const execPromise = promisify(exec); // Convert exec into a promise-based function

// // Define your cluster configurations
// const clusterConfigs: Record<string, IMinikubeClusterConfig | IEksClusterConfig> = {
//     "minikube-argocd": {
//         name: "minikube-argocd",
//         provider: "minikube",
//         kubernetesVersion: "1.30.2",
//         numberOfCpus: 4,
//         memory: "8g",
//         metalLbRange: "192.168.49.200-192.168.49.210",
//     },
//     "minikube-crossplane": {
//         name: "minikube-crossplane",
//         provider: "minikube",
//         kubernetesVersion: "1.30.2",
//         numberOfCpus: 4,
//         memory: "8g",
//         metalLbRange: "192.168.49.211-192.168.49.220",
//     },
//     "minikube-kubeflow": {
//         name: "minikube-kubeflow",
//         provider: "minikube",
//         kubernetesVersion: "1.31.0",
//         numberOfCpus: 16,
//         memory: "32g",
//         metalLbRange: "192.168.49.221-192.168.49.230",
//     },
// };

// // Define workloads for each cluster
// const workloads: Record<string, string[]> = {
//     "minikube-argocd": ["security-tools", "istio", "argocd"],
//     "minikube-crossplane": ["security-tools", "istio", "crossplane"],
//     "minikube-kubeflow": ["security-tools", "kubeflow"],
// };

// async function checkConnectivity(): Promise<boolean> {
//     try {
//         pulumi.log.info("Checking Minikube SSH (port 2222)...");
//         await execPromise("nc -zv localhost 2222");

//         pulumi.log.info("Checking Minikube API Server (port 8443)...");
//         await execPromise("nc -zv localhost 8443");

//         pulumi.log.info("✅ Minikube connection successful.");
//         return true;
//     } catch (error) {
//         pulumi.log.error(`❌ Minikube connection failed: ${error}`);
//         return false;
//     }
// }

// (async function main() {
//     const stack = pulumi.getStack();
//     const config = clusterConfigs[stack];

//     if (!config) {
//         throw new Error(`Unknown stack: ${stack}`);
//     }

//     const provider = createCluster(config);

//     pulumi.log.info(`Verifying connectivity to Minikube cluster '${config.name}'...`);

//     const isConnected = await checkConnectivity();

//     if (!isConnected) {
//         throw new Error("Minikube is not reachable. Workloads will not be deployed.");
//     }

//     pulumi.log.info(`Deploying workloads to '${config.name}'...`);
//     const clusterName = config.name;
//     await deployWorkloads(provider, clusterName, workloads[stack]);
// })();



import * as pulumi from "@pulumi/pulumi";
import { createCluster } from "./clusters/cluster-factory";
import { IMinikubeClusterConfig, IEksClusterConfig } from "./types/interfaces";
import { deployWorkloads } from "./utils/k8s";

// Define your cluster configurations
const clusterConfigs: Record<string, IMinikubeClusterConfig | IEksClusterConfig> = {
    "minikube-argocd": {
        name: "minikube-argocd",
        provider: "minikube",
        kubernetesVersion: "1.30.2",
        numberOfCpus: 4,
        memory: "8g",
        metalLbRange: "192.168.49.200-192.168.49.210",
    },
    "minikube-crossplane": {
        name: "minikube-crossplane",
        provider: "minikube",
        kubernetesVersion: "1.30.2",
        numberOfCpus: 4,
        memory: "8g",
        metalLbRange: "192.168.49.211-192.168.49.220",
    },
    "minikube-kubeflow": {
        name: "minikube-kubeflow",
        provider: "minikube",
        kubernetesVersion: "1.30.2",
        numberOfCpus: 16,
        memory: "32g",
        metalLbRange: "192.168.49.221-192.168.49.230",
    },
    // "kubeflow-cluster-eks": {
    //     name: "kubeflow-cluster-eks",
    //     provider: "eks",
    //     desiredCapacity: 3,
    //     instanceType: "t3.large",
    //     minSize: 1,
    //     maxSize: 5,
    // },
};

// Define workloads for each cluster
const workloads: Record<string, string[]> = {
    "argo-cluster": ["security-tools", "istio", "argocd"],
    "minikube-argocd": ["security-tools", "istio", "argocd"],
    "minikube-crossplane": ["security-tools", "istio", "crossplane"],
    "minikube-kubeflow": ["security-tools", "kubeflow"], // Isto is bundled already as part of Kubeflow so no need to specify it here
    "crossplane-cluster": ["security-tools", "istio", "crossplane"],
    "kubeflow-cluster": ["security-tools", "kubeflow"],
};

// Deploy the appropriate cluster and workloads
(async function main() {
    const stack = pulumi.getStack();
    const config = clusterConfigs[stack];

    if (!config) {
        throw new Error(`Unknown stack: ${stack}`);
    }

    // Create the cluster
    const provider = createCluster(config);

    // Deploy workloads
    const clusterName = config.name;
    await deployWorkloads(provider, clusterName, workloads[stack]);
})();

