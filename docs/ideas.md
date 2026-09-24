# Ideas

Unsorted. Move an idea into `decisions/` once we commit to it.

- **Team sync via encrypted QR/link** — team state encrypted, key in the URL fragment (never sent to a server); members scan to get an offline read-only copy. Live peer-to-peer (CRDT) sync as v2.
- **Covenant ceremony in facilitator mode** — one device in the room, one prompt per screen, printable covenant, quarterly renewal as a downloadable `.ics`.
- **Torch handover notes** that self-destruct once the next holder acknowledges them.
- **Coverage-gap flag** — "Press contact is uncovered Tue–Thu", never naming who is resting.
- **Real biomarkers** — manual salivary cortisol, heart rate/HRV via Web Bluetooth (Android Chrome only), or local import of a health-data export.
- **Air-gapped archive** — second never-online device; one-way encrypted export via USB or QR, then delete from the daily phone.
- **Decoy passphrase** opening harmless data; neutral app name/icon.
- **Languages** — English, Shona, Ndebele (keep UI strings in files from day one).

## Humane design research

Summary from the brainstorm that led to [decision 0006](decisions/0006-humane-design-patterns.md). Citations are from well-known work and still need checking before public use.

- **If-then plans** (Gollwitzer & Sheeran 2006, meta-analysis of 94 tests): deciding "when X, I'll do Y" in advance has a medium-to-large average effect on follow-through. Effects vary and are weaker for habits and in field settings.
- **Social norms** (Cialdini): people copy what they believe their group does. **Caveat:** a low descriptive norm backfires ("boomerang", Schultz et al. 2007, verify), so the app only leads with the rest count when at least half the team rested.
- **Self-determination theory** (Deci & Ryan): lasting change comes from autonomy, competence and belonging. The undermining effect of rewards applies mainly to expected tangible rewards (Deci, Koestner & Ryan 1999); our no-badges rule stands on its own grounds.
- **Fogg Behavior Model** (B = MAP): motivation, ability and a prompt must meet at the same moment. A design model, not a validated theory.
- **Fresh-start effect** (Dai, Milkman & Riis 2014): people change more readily at temporal landmarks such as a new week, so fresh-start messages refer to the new week.
- **Stopping cues**: a design principle (the opposite of infinite scroll), not a cited finding. Avoid citing Wansink; much of that work was retracted.
- **Activist burnout** (Chen & Gorski 2015, Journal of Human Rights Practice 7(3)): a small qualitative study (23 activists, verify) found martyrdom culture and guilt about rest central. "The team is the unit of change" is our inference, and the study doesn't generalise to Zimbabwe on its own.
- **"Rest Is Resistance"** (Tricia Hersey, 2022): kept off screen; "resistance" reads as opposition to the state on a searched phone. Our on-screen line is "Rest is part of the work."
- Later: leaders resting visibly first (needs a way that doesn't add leader labels).
