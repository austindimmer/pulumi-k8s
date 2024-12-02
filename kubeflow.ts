import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as command from "@pulumi/command";

// Namespace for Kubeflow
const kubeflowNamespace = new k8s.core.v1.Namespace("kubeflow", {
    metadata: { name: "kubeflow" },
}, {
    customTimeouts: { create: "5m" }, // Extended timeout for namespace creation
});

// Create the necessary Secret for Docker image pulling
const dockerSecret = new command.local.Command("dockerSecret", {
    create: `kubectl create secret generic regcred \
        --from-file=.dockerconfigjson=/workspaces/effektiv-ai/effektivai/.docker/config.json \
        --type=kubernetes.io/dockerconfigjson`,
    delete: `kubectl delete secret regcred`,
    triggers: [], // Optional: Add triggers if the secret needs to be updated
}, {
    dependsOn: [kubeflowNamespace],
});

// Clone the Kubeflow manifests repository locally
const cloneKubeflowRepo = new command.local.Command("cloneKubeflowRepo", {
    create: `
        echo "Cloning Kubeflow manifests repository...";
        git clone -b v1.9-branch https://github.com/kubeflow/manifests.git /tmp/kubeflow-manifests;
    `,
    delete: `rm -rf /tmp/kubeflow-manifests`,
}, {
    dependsOn: [kubeflowNamespace],
});

// Apply Kubeflow manifests with retry logic
const kubeflowManifests = new command.local.Command("applyKubeflowManifests", {
    create: `
        echo "Building and applying Kubeflow manifests...";
        cd /tmp/kubeflow-manifests/example;
        while true; do
            echo "Building manifests using kustomize...";
            kustomize build . > /tmp/kubeflow.yaml;
            if [ $? -eq 0 ]; then
                echo "Applying manifests using kubectl...";
                kubectl apply -f /tmp/kubeflow.yaml;
                if [ $? -eq 0 ]; then
                    echo "Kubeflow manifests applied successfully.";
                    break;
                else
                    echo "kubectl apply failed. Retrying in 20 seconds...";
                fi
            else
                echo "kustomize build failed. Retrying in 20 seconds...";
            fi
            sleep 20;
        done
    `,
    delete: `
        echo "Deleting Kubeflow manifests...";
        cd /tmp/kubeflow-manifests/example;
        kustomize build . | kubectl delete -f -;
    `,
}, {
    dependsOn: [cloneKubeflowRepo, dockerSecret],
    customTimeouts: { create: "15m" }, // Allow sufficient time for retries
});

// Export resources
export { kubeflowNamespace, dockerSecret, cloneKubeflowRepo, kubeflowManifests };
