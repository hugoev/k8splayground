# KubeTask GitOps Repo

Kubernetes manifests for KubeTask, managed by ArgoCD.

## Layout

- `apps/*/base`: base manifests per workload
- `argocd/root-application.yaml`: App of Apps parent
- `argocd/apps/*.yaml`: child Applications
- `environments/dev` and `environments/prod`: environment resources

## Bootstrap Flow

1. Install ArgoCD and ingress-nginx in your cluster.
2. Push this repo to GitHub and replace all `repoURL` placeholders.
3. Apply only the parent app:

```bash
kubectl apply -f argocd/root-application.yaml -n argocd
```

4. ArgoCD will sync all child applications automatically.

## Important Placeholders

- Replace image names:
  - `ghcr.io/your-org/kubetask-backend:0.1.0`
  - `ghcr.io/your-org/kubetask-frontend:0.1.0`
- Replace all `repoURL` values in `argocd/*.yaml`.
- Replace plaintext secrets with Sealed Secrets in Phase 2.

## Access

Ingress host is `kubetask.local`. Add to `/etc/hosts` for local clusters:

```text
127.0.0.1 kubetask.local
```
