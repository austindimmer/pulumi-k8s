import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as command from "@pulumi/command";
import { configureKubeflowIAM } from "../iam/kubeflow-iam";

export async function deploy(provider: k8s.Provider): Promise<void> {
    console.log("Deploying Kubeflow...");

    // Namespace for Kubeflow
    const kubeflowNamespace = new k8s.core.v1.Namespace("kubeflow", {
        metadata: { name: "kubeflow" },
    }, {
        provider,
        customTimeouts: { create: "5m" }, // Extended timeout for namespace creation
    });

    // Create the necessary Secret for Docker image pulling
    const dockerSecret = new command.local.Command("dockerSecret", {
        create: `
            cfg="$HOME/.docker/config.json"
            if [ -f "\${cfg}" ]; then
                kubectl create secret generic regcred \\
                    --from-file=.dockerconfigjson="\${cfg}" \\
                    --type=kubernetes.io/dockerconfigjson -n kubeflow
            else
                echo "Skipping regcred: \${cfg} not found"
            fi
        `,
        delete: `kubectl delete secret regcred -n kubeflow --ignore-not-found=true`,
    }, {
        dependsOn: [kubeflowNamespace],
    });

    // Clone the Kubeflow manifests repository locally
    const cloneKubeflowRepo = new command.local.Command("cloneKubeflowRepo", {
        create: `
            echo "Cloning Kubeflow manifests repository...";
            git clone -b v1.10.2 https://github.com/kubeflow/manifests.git /tmp/kubeflow-manifests || echo "Repo already cloned";
        `,
        delete: `
            echo "Cleaning up Kubeflow manifests repository...";
            if [ -d /tmp/kubeflow-manifests ]; then
                rm -rf /tmp/kubeflow-manifests;
            fi
        `,
    }, {
        dependsOn: [kubeflowNamespace],
    });

    // Apply Kubeflow manifests with retry logic
    const kubeflowManifests = new command.local.Command("applyKubeflowManifests", {
        create: `
            echo "Building and applying Kubeflow manifests...";
            if [ ! -d /tmp/kubeflow-manifests/example ]; then
                echo "Kubeflow manifests not found. Exiting.";
                exit 1;
            fi
            cd /tmp/kubeflow-manifests/example;
            while true; do
                echo "Building manifests using kustomize...";
                kustomize build . > /tmp/kubeflow.yaml || { echo "kustomize build failed"; sleep 20; continue; }
                echo "Applying manifests using kubectl...";
                kubectl apply -f /tmp/kubeflow.yaml || { echo "kubectl apply failed"; sleep 20; continue; }
                echo "Kubeflow manifests applied successfully.";
                break;
            done
        `,
        delete: `
            echo "Deleting Kubeflow manifests...";
            if [ ! -d /tmp/kubeflow-manifests/example ]; then
                echo "Kubeflow manifests directory not found. Skipping delete.";
                exit 0;
            fi
            cd /tmp/kubeflow-manifests/example;
            kustomize build . | kubectl delete -f - || echo "Failed to delete some resources. Continuing teardown.";
        `,
    }, {
        dependsOn: [cloneKubeflowRepo, dockerSecret],
        customTimeouts: { create: "15m", delete: "15m" }, // Allow sufficient time for retries
    });

    // Ensure namespace deletion happens cleanly
    const cleanupNamespace = new k8s.core.v1.Namespace("cleanupKubeflowNamespace", {
        metadata: { name: "kubeflow" },
    }, {
        provider,
        customTimeouts: { delete: "5m" }, // Timeout for namespace deletion
        deleteBeforeReplace: true, // Ensure the namespace is deleted before re-creating
        dependsOn: [kubeflowManifests], // Wait for manifests to be deleted first
    });

    // Configure IAM for Kubeflow
    const roleBinding = configureKubeflowIAM({
        provider,
        namespace: "kubeflow",
        userName: "minikube-kubeflow",
    });

    console.log("Kubeflow deployed successfully.");
}
