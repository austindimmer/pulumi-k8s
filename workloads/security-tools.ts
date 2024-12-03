// import * as k8s from "@pulumi/kubernetes";

// // Namespace for security tools.
// const securityNamespace = new k8s.core.v1.Namespace("security-tools", {
//     metadata: { name: "security-tools" },
// });

// // Deploy Kube-Bench.
// const kubeBenchJob = new k8s.yaml.ConfigFile("kube-bench", {
//     file: "https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml",
// }, { dependsOn: [securityNamespace] });

// // Deploy OPA Gatekeeper using Helm.
// const gatekeeper = new k8s.helm.v3.Chart("gatekeeper", {
//     chart: "gatekeeper",
//     version: "3.11.0",
//     fetchOpts: { repo: "https://open-policy-agent.github.io/gatekeeper/charts" },
//     namespace: "security-tools",
// }, { dependsOn: [securityNamespace] });

// // Deploy Polaris using a Helm chart.
// // const polaris = new k8s.helm.v3.Chart("polaris", {
// //     chart: "polaris",
// //     version: "5.2.0",
// //     fetchOpts: { repo: "https://charts.fairwinds.com/stable" },
// //     namespace: securityNamespace.metadata.name,
// //     values: {
// //         dashboard: {
// //             securityContext: {
// //                 allowPrivilegeEscalation: false,
// //                 capabilities: { drop: ["ALL"] },
// //                 runAsNonRoot: true,
// //                 runAsUser: 1000,
// //                 seccompProfile: { type: "RuntimeDefault" },
// //             },
// //             resources: {
// //                 requests: {
// //                     cpu: "100m",
// //                     memory: "128Mi",
// //                 },
// //                 limits: {
// //                     cpu: "150m",
// //                     memory: "512Mi",
// //                 },
// //             },
// //         },
// //     },
// // }, { dependsOn: [securityNamespace] });




// // Deploy Trivy as a Kubernetes deployment.
// // const trivyDeployment = new k8s.apps.v1.Deployment("trivy", {
// //     metadata: {
// //         name: "trivy",
// //         namespace: securityNamespace.metadata.name,
// //     },
// //     spec: {
// //         replicas: 1,
// //         selector: { matchLabels: { app: "trivy" } },
// //         template: {
// //             metadata: { labels: { app: "trivy" } },
// //             spec: {
// //                 containers: [
// //                     {
// //                         name: "trivy",
// //                         image: "aquasec/trivy:latest",
// //                         args: ["--server", "--severity", "HIGH", "--format", "json"],
// //                         ports: [{ containerPort: 4954 }],
// //                         securityContext: {
// //                             allowPrivilegeEscalation: false,
// //                             capabilities: { drop: ["ALL"] },
// //                             runAsNonRoot: true,
// //                             runAsUser: 1000,
// //                             seccompProfile: { type: "RuntimeDefault" },
// //                         },
// //                     },
// //                 ],
// //             },
// //         },
// //     },
// // }, { dependsOn: [securityNamespace] });



// // Deploy Kubescape as a CronJob for periodic scanning.
// const kubescapeCronJob = new k8s.batch.v1.CronJob("kubescape-cronjob", {
//     metadata: {
//         name: "kubescape-cronjob",
//         namespace: securityNamespace.metadata.name,
//     },
//     spec: {
//         schedule: "0 0 * * *", // Run daily at midnight
//         jobTemplate: {
//             spec: {
//                 template: {
//                     spec: {
//                         containers: [
//                             {
//                                 name: "kubescape",
//                                 image: "kubescape/kubescape:latest",
//                                 command: [
//                                     "kubescape",
//                                     "scan",
//                                     "framework",
//                                     "nsa",
//                                     "--submit",
//                                 ],
//                             },
//                         ],
//                         restartPolicy: "OnFailure",
//                     },
//                 },
//             },
//         },
//     },
// }, { dependsOn: [securityNamespace] });

// // export { securityNamespace, kubeBenchJob, gatekeeper, polaris, trivyDeployment, kubescapeCronJob };
// export { securityNamespace, kubeBenchJob, gatekeeper, kubescapeCronJob };


import * as k8s from "@pulumi/kubernetes";

export function deploy(provider: k8s.Provider): Promise<void> {
    console.log("Deploying Security Tools...");

    const securityNamespace = new k8s.core.v1.Namespace("security-tools", {
        metadata: { name: "security-tools" },
    }, { provider });

    new k8s.yaml.ConfigFile("kube-bench", {
        file: "https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml",
    }, { provider, dependsOn: [securityNamespace] });

    new k8s.helm.v3.Chart("gatekeeper", {
        chart: "gatekeeper",
        version: "3.11.0",
        fetchOpts: { repo: "https://open-policy-agent.github.io/gatekeeper/charts" },
        namespace: "security-tools",
    }, { provider, dependsOn: [securityNamespace] });

    return Promise.resolve();
}

