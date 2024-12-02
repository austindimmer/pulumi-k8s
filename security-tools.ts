import * as k8s from "@pulumi/kubernetes";

// Namespace for security tools.
const securityNamespace = new k8s.core.v1.Namespace("security-tools", {
    metadata: { name: "security-tools" },
});

// Deploy Kube-Bench.
const kubeBenchJob = new k8s.yaml.ConfigFile("kube-bench", {
    file: "https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml",
}, { dependsOn: [securityNamespace] });


// Deploy OPA Gatekeeper using Helm.
const gatekeeper = new k8s.helm.v3.Chart("gatekeeper", {
    chart: "gatekeeper",
    version: "3.11.0",
    fetchOpts: { repo: "https://open-policy-agent.github.io/gatekeeper/charts" },
    namespace: "security-tools",
}, { dependsOn: [securityNamespace] });



// Example: Add more tools here (e.g., Polaris, Trivy, Kubescape).
