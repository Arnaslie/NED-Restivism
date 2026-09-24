# 0002. Personal energy "battery", computed and kept on-device only

- Status: accepted
- Date: 2026-09-24
- Amends: the concept brief's "no individual mood data, team-level pulse only"

## Context
We want a personal energy "battery" as the core feedback loop. The brief bans individual mood data because a person's state and schedule are surveillance targets: a leaked schedule shows when someone is off, away or alone, and when a role is thinly covered.

## Decision
- The battery (0–100%) is computed and stored **only on the activist's own device**, encrypted. It is never synced, shared, exported or included in a team share.
- Inputs in v1: logged activities (type × duration × intensity drain; rest/sleep recharge), an optional one-tap self-check, and **mock** cortisol readings for development only.
- When low, the app privately suggests asking for cover. The team sees only "<role> needs cover" — never the reason or the level.
- Team shares carry **near-term role coverage only** (next 48–72h, coarse day-parts, expiring). Never rest windows, battery, or history.
- Presented as an *estimated stress load*, never a medical measurement. No streaks or history charts.

## Consequences
- The team-level pulse from the brief stays aggregate-only and hidden below 3 responses.
- Real biomarker input (manual cortisol, heart-rate/HRV via Web Bluetooth or health-export import) is deferred; the record format already has room for it.
