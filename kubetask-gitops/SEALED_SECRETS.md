# Sealed Secrets Integration (Phase 2)

Sealed Secrets encrypt sensitive data at rest in git so you can safely version-control credentials without exposing plaintext passwords.

## Installation

```bash
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.25.0/controller.yaml
```

## Setup Sealing Key

Sealed Secrets uses a per-cluster RSA key. Backup yours:

```bash
kubectl get secret -n kube-system -l sealedsecrets.bitnami.com/status=active -o yaml > sealed-secrets-key-backup.yaml
chmod 600 sealed-secrets-key-backup.yaml
```

Store this safely (e.g., password manager or separate encrypted repo).

## Create & Seal a Secret

1. **Create a secret YAML locally (never commit this)**:

```yaml
---
apiVersion: v1
kind: Secret
metadata:
  name: backend-secret
  namespace: kubetask
type: Opaque
stringData:
  POSTGRES_PASSWORD: my-super-secret-password
```

2. **Encrypt it with sealpkg**:

```bash
kubectl create secret generic backend-secret \
  --from-literal=POSTGRES_PASSWORD=my-super-secret-password \
  -n kubetask --dry-run=client -o yaml | \
  kubeseal -f - -w kubetask-gitops/apps/backend/base/backend-sealed-secret.yaml
```

3. **Use the sealed secret in your manifests**:

Replace the `Secret` in `apps/backend/base/secret.yaml` with the `SealedSecret` from `backend-sealed-secret.yaml`.

4. **Now you can commit safely**:

```bash
git add kubetask-gitops/apps/backend/base/backend-sealed-secret.yaml
git commit -m "secrets: seal backend database credentials"
```

## Unsealing

Only the cluster with the sealing key can unseal these secrets. This pattern ensures:
- ✅ Secrets are encrypted in git
- ✅ Only the cluster can decrypt them
- ✅ Key rotation via Sealed Secrets rotation tools
- ✅ CI/CD can commit new secrets without human access to values

## What Big Tech Does

Companies like Google, AWS, Stripe use templated secret systems:
- dev cluster has one sealing key → dev secrets encrypted with dev key
- prod cluster has separate key → prod secrets encrypted independently
- GitOps repo stores all encrypted variants
- ArgoCD uses namespace-aware secret overlays to deploy the right encryption for each environment

This is how you ship production-grade infra that passes security audits.
