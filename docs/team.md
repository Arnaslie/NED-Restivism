# Team and ownership

Each workstream owns a code area and a contract other streams build against.
Change another stream's area through a PR they review.

| Role | Owns | Code area | First deliverable |
|---|---|---|---|
| History engineer | Activity records: schema, encrypted storage, retention, auto-delete | `src/store/` | [record-format.md](record-format.md) + store API (`save`, `list`, `purge`, `wipe`) |
| UI engineer | All screens: ceremony, rota, battery, handover, settings/panic | `src/ui/` | Clickable screens on mock data, tested on a low-end Android phone |
| Infra engineer | Hosting, service worker, CSP, share format, "no server-side data" guarantee | `sw.js`, `src/share/`, deploy | Reproducible static deploy with no user data server-side, CSP enforced |
| Activist (Zimbabwe context) | Threat model, ground truth, user testing | `docs/threat-model.md` | First pass of the threat model |

## Day-one contract

The **activity record format** ([record-format.md](record-format.md)). UI, battery and storage all depend on it; agree it first, then build in parallel against [`mock/activities.json`](../mock/activities.json).

## Team rules

- **No real data anywhere in the project.** No real activist data, names, places or event details in the repo, issues, PRs, test fixtures, screenshots or demo recordings. The repo is public. Use `mock/` data only.
- Ship small: every change goes through a PR to `main`.
