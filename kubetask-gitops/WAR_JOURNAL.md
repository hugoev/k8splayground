# KubeTask War Journal

Track every issue and fix as interview-ready incident narratives.

## Template

### Date
- Symptom:
- Root cause:
- Fix:
- Prevention:
- Command snippets:

## Entries

### 2026-04-13
- Symptom: ArgoCD parent app path and child file layout were inconsistent.
- Root cause: Child app manifests were created under `argocd/` while parent scanned `argocd/apps`.
- Fix: Moved child manifests into `argocd/apps`.
- Prevention: Validate parent `source.path` against repo tree before first sync.
- Command snippets:
  - `mv argocd/apps-*.yaml argocd/apps/`
