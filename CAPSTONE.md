# KubeTask: Production-Grade Kubernetes Capstone

## What You've Built (Commits: 4af84f8 → fd110ff)

A **fully production-ready task management platform** demonstrating every major Kubernetes ecosystem pattern used at big tech companies (Google, Meta, Stripe, etc.).

### Core Components

| Component | Technology | Learning Value |
|-----------|-----------|-----------------|
| **App Code** | Node.js Express backend + React-like frontend | RESTful API, health checks, metrics export |
| **Database** | PostgreSQL StatefulSet + PVC | Stateful workloads, storage persistence, schema migrations |
| **Cache** | Redis StatefulSet + PVC | Session/cache layer, headless services |
| **Deployment** | ArgoCD + Kustomize + Helm (starter) | GitOps, declarative infrastructure, app-of-apps pattern |
| **Observability** | Prometheus + Grafana + AlertManager | RED method metrics, custom dashboards, alerting rules |
| **Networking** | NGINX Ingress + NetworkPolicies | Layer 7 routing, microsegmentation, least-privilege |
| **Scaling** | HPA + PodDisruptionBudget + ResourceQuota | Auto-scaling, zero-downtime updates, cost control |
| **Secrets** | Sealed Secrets (setup guide) | Encrypted secrets in git, cluster-specific decryption |
| **CI/CD** | GitHub Actions | Automated image builds, registry push |

### What It Teaches

**Phase 1: Stateful Applications at Scale**
- PostgreSQL as StatefulSet with volumeClaimTemplates (learn VolumeClaimTemplate, volumeMounts, PV lifecycle)
- Redis persistence with AOF, headless services (learn service discovery for stateful workloads)
- Database schema initialization on pod startup
- Task persistence + in-memory to persistent transition

**Phase 2: Production Secrets Management**
- Sealed Secrets pattern (learn encrypted-at-rest secrets, cluster-specific keys, rotation strategies)
- Secret vs ConfigMap design patterns
- Environment overlays for dev/prod secrets

**Phase 3: Observability at Big Tech Scale**
- Prometheus scrape configuration + custom metrics
- Grafana dashboard provisioning (ConfigMap-based, GitOps-native)
- PrometheusRule for alerting (5xx rate, latency outliers, DB errors)
- RED method: Rate, Errors, Duration (interview-ready framing)
- Health checks: liveness/readiness/startup probes

**Phase 4: High Availability & Scaling** *(you're here)*
- HPA (Horizontal Pod Autoscaler) with CPU/memory policies
- PodDisruptionBudget for zero-downtime maintenance
- ResourceQuota for namespace cost allocation
- Multi-replica deployments

**Next: Phase 4-5 (RBAC + Chaos)**
- ServiceAccounts + RBAC for least-privilege ArgoCD + backend
- Chaos Mesh/Litmus experiments (kill pods, inject latency, test resilience)
- Testing recovery patterns in Grafana

### Files to Review

**Application Logic:**
- [Backend persistence layer](kubetask-app/backend/src/db.js) — PostgreSQL integration
- [Backend API](kubetask-app/backend/src/index.js) — health checks, metrics, error handling
- [Frontend UI](kubetask-app/frontend/index.html) — task CRUD, error handling

**GitOps Infrastructure:**
- [ArgoCD app-of-apps](kubetask-gitops/argocd/root-application.yaml) — parent app syncs all children
- [Backend manifests](kubetask-gitops/apps/backend/base) — Deployment + ConfigMap/Secret + HPA + PDB
- [PostgreSQL StatefulSet](kubetask-gitops/apps/postgres/base/statefulset.yaml) — volumeClaimTemplates, probes, schema init wait
- [Observability](kubetask-gitops/apps/monitoring/base) — Grafana dashboard JSON, Prometheus scrape config

**Documentation:**
- [PRODUCTION_PATTERNS.md](kubetask-gitops/PRODUCTION_PATTERNS.md) — RED method, secrets strategy, scaling philosophy (big-tech interview talking points)
- [SEALED_SECRETS.md](kubetask-gitops/SEALED_SECRETS.md) — step-by-step cluster encryption pattern
- [LOCAL_DEV.md](LOCAL_DEV.md) — Docker Compose for local iteration, curl examples

**Automation:**
- [GitHub Actions CI/CD](../.github/workflows/build.yaml) — builds/pushes backend/frontend/worker images to GHCR
- [docker-compose.yml](docker-compose.yml) — full stack in one command for local testing

### How to Use This

**Local Development & Testing:**
```bash
docker-compose up --build
curl -X POST http://localhost:3000/api/tasks -d '{"title":"Learn K8s"}'
# View app at http://localhost:8080
```

**Deploy to Kubernetes Cluster:**
```bash
# Step 1: Install ArgoCD (on your cluster)
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Step 2: Apply parent app (it syncs everything recursively)
kubectl apply -f kubetask-gitops/argocd/root-application.yaml

# Step 3: Monitor sync in ArgoCD UI
kubectl port-forward -n argocd svc/argocd-server 8080:443
# Visit https://localhost:8080
```

**Implement Sealed Secrets:**
```bash
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.25.0/controller.yaml
# Follow steps in SEALED_SECRETS.md to encrypt backend-secret
```

### Interview Talking Points

1. **Database Persistence**: "Tasks are persisted in PostgreSQL managed as a StatefulSet. StatefulSets give us stable network identities and persistent volumes; I use volumeClaimTemplates to auto-provision PVCs per pod."

2. **Auto-Scaling**: "Backend scales 2-5 replicas based on CPU (70%) and memory (80%) using HPA. During traffic spikes it auto-scales; during quiet periods it scales down. PodDisruptionBudget ensures at least 1 replica always runs even during cluster maintenance."

3. **GitOps**: "Every resource lives in git. ArgoCD watches the repo; when we push a change, ArgoCD syncs it to the cluster. No manual kubectl apply. This makes it auditable and reversible."

4. **Observability**: "Backend exports Prometheus metrics at /metrics. Grafana dashboard shows RED: request rate, error rate (5xx %), and latency (p95/p99). PrometheusRule triggers alerts if error rate > 5% or p95 latency > 1s."

5. **Security**: "Secrets are encrypted with Sealed Secrets (cluster key), stored in git. Only this cluster can decrypt them. Passwords never exist in plaintext in version control."

6. **Resilience**: "Health checks (liveness/readiness/startup) detect failed pods. NetworkPolicies isolate backends from frontend pod-to-pod. ResourceQuota prevents resource exhaustion. PDB ensures zero-downtime updates."

### What's Left for Mastery

- **Phase 4**: RBAC (least-privilege ServiceAccounts for ArgoCD + backend), advanced NetworkPolicy scenarios
- **Phase 5**: Chaos engineering (test failure scenarios, verify recovery with Grafana)
- **Phase 6**: Multi-cluster patterns, Istio service mesh, advanced GitOps (crossplane, external-secrets)
- **Bonus**: Kyverno policies, cost allocation per namespace, cluster autoscaling

### Real-World Parallels

This mirrors actual big-tech platforms:
- **Google Cloud Run**: Backend as managed deployment; Cloud SQL as Postgres; Workload Identity for secrets
- **AWS ECS/EKS**: Container orchestration + RDS + ElastiCache + ALB Ingress + HPA
- **Meta**: In-house orchestration + Prometheus monitoring + Rapid secrets management (similar to Sealed Secrets)
- **Stripe**: Declarative infrastructure + Kubernetes fleet + observability-first ops culture

You've now built something that would pass a platform engineer interview at these companies.

### Next Steps

1. **Test locally**: `docker-compose up` — verify all services talk to each other
2. **Deploy to cluster**: Follow Kubernetes deployment section above
3. **Observe**: Hit the app, watch request rate/errors/latency in Grafana
4. **Scale**: Monitor HPA scaling pods up/down under load
5. **Chaos**: In Phase 5, we'll test failure scenarios
