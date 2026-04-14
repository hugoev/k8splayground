# Phase 2-3: Production Observability & Scaling (Big Tech Patterns)

This document explains the production-grade patterns we've implemented that real platform teams at Google, Meta, Stripe use daily.

## Observability: RED Method

The Grafana dashboard you now have tracks **RED**:
- **R**ate: How many requests/sec? (queries growing over time = load increasing)
- **E**rrors: What's the error rate trending? (5xx ratio > 5% = page incident)
- **D**uration: What's the latency at p95/p99? (slow requests harm user experience)

```
kubetask:backend:overview dashboard shows:
├── Request rate (5m rolling) — "Are users increasing?"
├── Error rate (5xx %) — "Are we breaking?"
├── Latency (p95/p99) — "Is it slow?"
└── DB errors — "Is storage down?"
```

This is what on-call engineers check first during an incident.

## Secrets: Sealed Secrets Pattern

Without Sealed Secrets:
```yaml
# ❌ BAD: plaintext in git = security breach
apiVersion: v1
kind: Secret
stringData:
  password: "super-secret-password"  # Visible in git history FOREVER
```

With Sealed Secrets:
```yaml
# ✅ GOOD: encrypted with cluster key, only cluster can decrypt
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: backend-secret
spec:
  encryptedData:
    password: AgB5Sh7k3L2m9pQ1r4sT... # Only decrypts on THIS cluster
```

**What big tech does:**
- Dev cluster uses one sealing key → encrypts all dev secrets
- Prod cluster uses different key → prod secrets encrypted independently  
- GitOps repo has ALL secrets (encrypted)
- Means: rotate via key rotation tools, not manual secret management
- Compliance: pass security audits by never storing plaintext in version control

See [SEALED_SECRETS.md](SEALED_SECRETS.md) for setup.

## Scaling: HPA (Horizontal Pod Autoscaler)

```yaml
spec:
  minReplicas: 2          # Always at least 2 pods (availability)
  maxReplicas: 5          # Don't exceed 5 (cost control)
  metrics:
    - cpu: 70%            # Scale up when average pod CPU hits 70%
    - memory: 80%         # Scale up when memory hits 80%
  behavior:
    scaleUp:              # Aggressive: add up to 2 pods every 15s during spike
      policies:
        - type: Pods
          value: 2
          periodSeconds: 15
    scaleDown:            # Conservative: remove gradually, wait 5min after scaling
      stabilizationWindowSeconds: 300
```

**Why this matters:**
- During a traffic spike (e.g., viral feature): HPA automatically prevents overload
- If a pod crashes: min 2 replicas keeps service running
- Cost efficiency: scale down when load drops (cloud bills are huge at scale)

**Big tech example:**
- YouTube: HPA backed by ML prediction models (predict traffic spikes before they happen)
- AWS peak scaling: hundreds of pods spawning in seconds
- Real incident: bad code hits prod → HPA scales to 5 → catches the user impact

## Availability: PodDisruptionBudget (PDB)

```yaml
minAvailable: 1  # During maintenance/updates, keep at least 1 pod running
```

**Scenario without PDB:**
```
Cluster update happening...
→ Kubernetes evicts all backend pods simultaneously
→ No pods running
→ All requests 503
→ Customer-facing outage
```

**Scenario with PDB (minAvailable: 1):**
```
Cluster update happening...
→ Kubernetes evicts 1 pod at a time, waits for replacement to be ready
→ Always at least 1 pod serving traffic
→ Zero downtime update
```

This is **Kubernetes best practice**: never bring down ALL replicas at once.

## Resource Quotas

```yaml
ResourceQuota kubetask-quota:
  CPU requests: 4 cores max
  Memory requests: 4Gi max
  Pods: 20 max
```

**Why:**
- Prevents a buggy app from consuming all cluster resources
- Multi-tenant clusters need quotas (so App A doesn't starve App B)
- Big tech enforces per-namespace quotas for cost allocation

## What You've Now Built

This is a full **production-grade backend** that:
- ✅ Scales automatically under load
- ✅ Exposes real metrics (request rate, errors, latency)
- ✅ Survives cluster maintenance (PDB)
- ✅ Stores secrets securely (Sealed Secrets pattern)
- ✅ Has cost controls (resource quotas, max replicas)

**Interview talking points:**
- "Our backend uses HPA for automatic scaling, scales 2-5 replicas based on CPU/memory"
- "We use PDB to ensure zero-downtime updates"
- "All secrets are Sealed Secrets encrypted with cluster key, never plain text in git"
- "Observability via RED method: rate, errors, duration tracked in Grafana"
- "Resource quotas prevent noisy neighbors from impacting other apps"

This is exactly what SRE/platform teams implement before going to production.
