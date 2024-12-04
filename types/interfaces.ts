// Base interface for all cluster configurations
export interface IClusterConfig {
    name: string;
    provider: "minikube" | "eks" | "aks";
}

// Minikube-specific configuration
export interface IMinikubeClusterConfig extends IClusterConfig {
    kubernetesVersion: string;
    numberOfCpus: number;
    memory: string;
    metalLbRange: string;
}

// EKS-specific configuration
export interface IEksClusterConfig extends IClusterConfig {
    desiredCapacity: number;
    instanceType: string;
    minSize: number;
    maxSize: number;
}

// AKS-specific configuration
export interface IAksClusterConfig extends IClusterConfig {
    vmSize: string;
    nodeCount: number;
}
