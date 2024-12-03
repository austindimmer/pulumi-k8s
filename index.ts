import * as pulumi from "@pulumi/pulumi";
import { BaseCluster, IMinikubeClusterConfig, IEksClusterConfig, IAksClusterConfig } from "./base-cluster";

// Helper function to deploy workloads to a specific cluster
async function deployWorkloads(provider: pulumi.ProviderResource, workloads: string[]): Promise<void> {
    for (const workload of workloads) {
        await import(`./workloads/${workload}`)
            .then((module) => module.deploy(provider))
            .then(() => console.log(`${workload} deployed successfully.`))
            .catch((err) => console.error(`Error deploying ${workload}:`, err));
    }
}

// Define configurations for each cluster
const argoClusterConfig: IMinikubeClusterConfig = {
    name: "argo-cluster",
    provider: "minikube",
    numberOfCpus: 4,
    memory: "8g",
    metalLbRange: "192.168.49.200-192.168.49.210",
    enableSecurityTools: true,
};

const crossplaneClusterConfig: IMinikubeClusterConfig = {
    name: "crossplane-cluster",
    provider: "minikube",
    numberOfCpus: 4,
    memory: "8g",
    metalLbRange: "192.168.49.211-192.168.49.220",
    enableSecurityTools: true,
};

const kubeflowClusterConfig: IMinikubeClusterConfig = {
    name: "kubeflow-cluster",
    provider: "minikube",
    numberOfCpus: 16,
    memory: "32g",
    metalLbRange: "192.168.49.221-192.168.49.230",
    enableSecurityTools: true,
};

// Define workloads for each cluster
const argoWorkloads = ["security-tools", "istio", "argocd"];
const crossplaneWorkloads = ["security-tools", "istio", "crossplane"];
const kubeflowWorkloads = ["security-tools", "kubeflow"];

// Deploy clusters and their respective workloads
async function deployClusters(): Promise<void> {
    console.log("Starting deployment...");

    // Create Argo cluster and deploy workloads
    console.log("Creating Argo cluster...");
    const argoCluster = new BaseCluster(argoClusterConfig);
    await deployWorkloads(argoCluster.provider, argoWorkloads);

    // Create Crossplane cluster and deploy workloads
    console.log("Creating Crossplane cluster...");
    const crossplaneCluster = new BaseCluster(crossplaneClusterConfig);
    await deployWorkloads(crossplaneCluster.provider, crossplaneWorkloads);

    // Create Kubeflow cluster and deploy workloads
    console.log("Creating Kubeflow cluster...");
    const kubeflowCluster = new BaseCluster(kubeflowClusterConfig);
    await deployWorkloads(kubeflowCluster.provider, kubeflowWorkloads);

    console.log("All clusters and workloads deployed successfully.");
}

// Run the deployment
deployClusters().catch((err) => {
    console.error("Deployment failed:", err);
    process.exit(1);
});
