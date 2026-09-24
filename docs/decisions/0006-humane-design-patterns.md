# 0006. Humane design: persuasive patterns pointed at rest

- Status: accepted
- Date: 2026-09-24
- Builds on: [0002](0002-personal-battery-on-device.md), [0005](0005-teams-status-covenant.md)

## Context
Engagement-driven apps use behavioural psychology to keep people on their phones. We use the same evidence to get people *off* them and into rest. The research summary behind this is in [ideas.md](../ideas.md#humane-design-research); sources are well-known but still to be checked before we quote them publicly.

## Decision
We adopt five patterns:

1. **If-then rest plan** (implementation intentions). Each person writes one private plan: *"When ___, I will ___."* It's offered when creating or joining a team, and editable any time in Settings. Stored encrypted on the phone only, never shared. Shown on the Battery screen when the battery is low.
2. **Team total framed around rest taken** (social norms). The check-in also counts who had at least one **full rest day** in the last 7 days. The team sees "3 of 5 of us took a full rest day this week" first, then the running-low line. Same minimum of 3; individual answers are sealed to the check-in like the `low` flag.
3. **Stopping cues.** Every screen has a clear end ("That's all for now"). No feeds, badges, pull-to-refresh or "see more".
4. **Fresh starts, not streaks.** After each check-in the team gets a quiet fresh-start message. No running counters, ever.
5. **Private, honest progress.** The Battery screen shows *your own* full rest days this week and last week, phrased as an invitation, never as a warning or a comparison with anyone. It measures rest, never app use.

A **full rest day** = a date with at least one `rest` entry and no work entries (`action`, `meeting`, `travel`, `support`, `admin`).

All copy follows the activist's word rules ([covenant-prompts.md](../covenant-prompts.md)): calm, rest as part of the work, no activist-coded words.

## Consequences
- Adds one boolean to status snapshots and one count to the summary (see [team-protocol.md](../team-protocol.md)).
- Adds one encrypted personal document (the rest plan).
- Still ruled out: streaks, points, badges, comparisons between people or teams, push notifications, measuring time in app.
