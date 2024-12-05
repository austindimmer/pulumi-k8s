import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

interface KubeflowIAMArgs {
    provider: k8s.Provider;
    namespace: string;
    userName: string; // The user or service account needing access
}

export function configureKubeflowIAM(args: KubeflowIAMArgs): k8s.rbac.v1.RoleBinding {
    const { provider, namespace, userName } = args;

    // Create the RoleBinding
    const roleBinding = new k8s.rbac.v1.RoleBinding("centraldashboard-access-binding", {
        metadata: {
            name: "centraldashboard-access-binding",
            namespace,
        },
        subjects: [
            {
                kind: "User",
                name: userName,
                apiGroup: "rbac.authorization.k8s.io",
            },
        ],
        roleRef: {
            kind: "Role",
            name: "centraldashboard", // Assuming this Role already exists
            apiGroup: "rbac.authorization.k8s.io",
        },
    }, { provider });

    return roleBinding;
}
