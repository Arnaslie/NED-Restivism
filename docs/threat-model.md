# Threat model

Owner: activist (Zimbabwe context). Everyone reviews. Keep it free of real names, places and incidents.

## Who we protect
Activists using the app, and their teams.

## Assets (what an adversary wants)
- When a person is working, resting, away or alone (their schedule)
- Which roles are thinly covered, and when
- Activity history (the "diary")
- Who is on a team

## Adversaries and capabilities
<!-- Activist: fill in and verify. Starting points to confirm or correct: -->
- [ ] Device seizure/search at arrest or checkpoints
- [ ] Network interception (lawful-intercept legislation — cite the specific acts)
- [ ] Internet shutdowns / throttling
- [ ] SIM registration tying phone numbers to identity
- [ ] Coercion of a team member to unlock their phone
- [ ] Infiltration of a team
- [ ] Other:

## Conditions of use
<!-- Devices, data costs, connectivity, languages (English/Shona/Ndebele?), shared phones, literacy -->

## Mitigations (map each to a threat above)
| Threat | Mitigation | Status |
|---|---|---|
| Device seizure | Encrypted local storage, auto-lock, panic wipe, 14-day auto-delete | planned (0003) |
| Server-side identification | No accounts, no server-side user data | planned (0003) |
| Leaked team schedule | Shares show near-term role coverage only, never rest windows or battery | planned (0002) |
| Shutdowns | Offline-first PWA | done (0001) |

## Open questions
