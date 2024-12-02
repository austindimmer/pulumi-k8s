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

// Apply Kubeflow manifests with retry logic
const kubeflowManifests = new command.local.Command("applyKubeflowManifests", {
    create: `
        while ! kustomize build "https://github.com/kubeflow/manifests.git/v1.9-branch/example" | kubectl apply -f -; do 
            echo "Retrying to apply resources"; 
            sleep 20; 
        done
    `,
    delete: `kustomize build "https://github.com/kubeflow/manifests.git/v1.9-branch/example" | kubectl delete -f -`,
}, {
    dependsOn: [kubeflowNamespace, dockerSecret],
    customTimeouts: { create: "15m" }, // Allow sufficient time for retries
});

// Export resources
export { kubeflowNamespace, dockerSecret, kubeflowManifests };
