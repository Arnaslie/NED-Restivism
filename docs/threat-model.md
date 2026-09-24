# Threat model

> **DRAFT — prepared for review by the team's activist. Every item marked (verify) must be confirmed before we rely on it.**
>
> First pass drafted from public sources only (laws, NGO reports, nationwide incidents). It contains no names, places or cases of private people, and must stay that way: the repo is public.

Owner: activist (Zimbabwe context). Everyone reviews. Keep it free of real names, places and incidents involving private people.

## Who we protect
Activists using the app, and their teams, including members who never install it but are named in a role or share.

## Assets (what an adversary wants)
| Asset | Why it matters | Where it lives in our design |
|---|---|---|
| A person's schedule: when they work, rest, travel or are alone | Tells an adversary when to find, follow or pick someone up | Activity records, battery (device only, [0002](decisions/0002-personal-battery-on-device.md), [0003](decisions/0003-encrypted-local-storage-auto-delete.md)) |
| Which roles are thinly covered, and when | Tells an adversary when a group is weakest | Team shares (near-term coverage) |
| Activity history (the "diary") | Evidence of participation in "actions" and meetings | Encrypted records, 14-day window |
| Who is on a team, and what roles exist | Membership and structure of a group; role names can themselves be incriminating | Team setup, rota, shares |
| The fact that a person uses the app at all | An "activist app" on a phone can itself attract suspicion at a search | Home screen, app name, browser history, domain |

## Adversaries and capabilities

### A. Physical access to the phone (highest likelihood)
- [x] **Device seizure and search at arrest, raids or checkpoints.** Freedom House reports that around the August 2023 elections security forces *"demanded individuals' phone passwords before confiscating their devices"* ([Freedom on the Net 2024](https://freedomhouse.org/country/zimbabwe/freedom-net/2024)). Amnesty documented arbitrary arrests around the same elections ([Amnesty, Aug 2023](https://www.amnesty.org/en/latest/news/2023/08/zimbabwe-elections-marred-by-arbitrary-arrests-internet-blockade/)). HRW records arrests of journalists and activists through 2025 ([HRW World Report 2026](https://www.hrw.org/world-report/2026/country-chapters/zimbabwe)). How routinely phones are searched at ordinary roadblocks is **(verify)**.
- [x] **Coerced unlocking.** Direct demand for passwords is documented above. We must assume the person may be made to open the phone *and* the app.
- [x] **Legal powers to search computers.** The Cyber and Data Protection Act, 2021 ([ZimLII](https://zimlii.org/akn/zw/act/2021/5/eng@2022-03-11)) inserted s.379A–379E into the Criminal Procedure and Evidence Act: search and seizure of computer systems, copying data on site, expedited preservation, production orders by a magistrate, admissibility of electronic evidence ([Council of Europe Octopus summary](https://www.coe.int/en/web/octopus/-/zimbab-1)). Whether these include a duty on the *owner* to give passwords or assist is **(verify)**.
- [ ] **Forensic extraction tools** (e.g. commercial phone-extraction kits) in use by Zimbabwean police: no credible public source found. **(verify)** — assume capable of a full logical copy of an unlocked phone.
- [x] **Shared or borrowed phones.** Family members or others with physical access can open the app (see Conditions of use).

### B. Network and telecom
- [x] **Lawful interception.** The Interception of Communications Act [Chapter 11:20], 2007 ([ZimLII](https://zimlii.org/akn/zw/act/2007/6/eng@2022-03-11)):
  - interception warrants are issued by a **Minister**, not a judge, valid three months, on grounds including "national security" and "compelling national economic interest" ([summary via ICT Policy Africa](https://ictpolicyafrica.org/en/document/mnc9fr8fjxk));
  - service providers must install hardware/software that makes interception possible and must assist, or commit an offence;
  - a **notice of disclosure of "protected information"** can require encrypted data to be decrypted or a key handed over **(verify section number and whether it applies to individuals, not only providers)**.
  - It was amended by the Cyber and Data Protection Act 2021 **(verify what changed)**.
- [x] **Online speech offences.** The 2021 Act also created offences for transmitting data messages that incite violence or are "false" ([MISA Zimbabwe analysis](https://zimbabwe.misa.org/2021/12/06/analysis-of-the-data-protection-act/); [Freedom on the Net 2024](https://freedomhouse.org/country/zimbabwe/freedom-net/2024)). HRW reports a journalist held 71 days pre-trial in 2025 on an "inciting violence" transmission charge ([HRW 2026](https://www.hrw.org/world-report/2026/country-chapters/zimbabwe)). Implication: anything the app lets people *write or send* can become evidence.
- [x] **Mobile interception tech.** Citizen Lab identified Zimbabwe as a likely customer of Circles (NSO-affiliated), which exploits SS7 weaknesses to locate phones and intercept calls/SMS ([Citizen Lab, Dec 2020](https://citizenlab.ca/2020/12/running-in-circles-uncovering-the-clients-of-cyberespionage-firm-circles/)). Whether it is still in use is **(verify)**. Implication: SMS and phone-number-based anything is weak.
- [x] **Spyware on devices** (e.g. Pegasus-class implants): no credible public report of use against Zimbabwean activists found. **(verify)** Out of scope for us to defeat; see residual risks.
- [x] **Network observers see which sites a phone visits.** Even over HTTPS, the ISP sees the domain (DNS / TLS SNI). A recognisable domain for the app is a signal.

### C. Identity
- [x] **SIM registration.** Postal and Telecommunications (Subscriber Registration) Regulations, SI 142 of 2013 (gazetted 27 Sept 2013), later replaced/updated by SI 95 of 2014 **(verify which is in force)**: every SIM tied to name, address, ID number, held in POTRAZ's Central Subscriber Information Database ([Privacy International](https://privacyinternational.org/news-analysis/1496/zimbabwe-threatening-privacy-rights-new-sim-registration-database); [APC](https://www.apc.org/en/blog/zimbabwe-new-sim-registration-database-law-represses-twin-rights-privacy-and-expression)). Implication: **a phone number is a real-name identifier.** Never use it as an identity.

### D. Shutdowns and throttling
| Date | Event | Source |
|---|---|---|
| 15 Jan 2019 (≈ several days) | Nationwide internet and social media shutdown during fuel-price protests, ordered under the Interception of Communications Act. High Court set the directives aside on 21 Jan 2019 (Minister lacked authority). | [MISA Zimbabwe](https://zimbabwe.misa.org/2019/01/21/high-court-sets-aside-internet-shut-down-directives/); [Freedom on the Net 2019](https://freedomhouse.org/country/zimbabwe/freedom-net/2019) |
| 31 Jul 2020 | Throttling on state-owned TelOne during planned protests | [NetBlocks](https://netblocks.org/reports/zimbabwe-internet-disruption-limits-coverage-of-protests-7yNV70yq); [Access Now](https://www.accessnow.org/press-release/stop-stifling-free-speech-zimbabwe-must-keepiton-during-planned-protests/) |
| 20 Feb 2022 | Slowdown during an opposition rally livestream | [NetBlocks](https://netblocks.org/reports/internet-slowdown-limits-coverage-of-zimbabwe-opposition-rally-oy9Ykoy3) |
| Aug 2023 (election) | Degradation on election evening; government blamed subsea cable cuts **(verify cause)** | [Freedom on the Net 2024](https://freedomhouse.org/country/zimbabwe/freedom-net/2024) |
| Jun 2024 – May 2025 | No shutdowns reported, but power outages routinely cut access | [Freedom on the Net 2025](https://freedomhouse.org/country/zimbabwe/freedom-net/2025) |

Pattern: disruptions cluster around protests and elections, exactly when teams most need the rota. Load-shedding is a daily outage in practice.

### E. People
- [ ] **Infiltration of a team.** Widely feared in civil society; we found no public report specific enough to cite **(verify with the activist)**. We assume any team member, or anyone holding a share link, may be an informer, or may later be arrested and have their phone searched.
- [x] **Direct physical threats.** HRW reports a critic's home bombed (30 Aug 2025) and a civil society office destroyed by suspected arson (27 Oct 2025) ([HRW 2026](https://www.hrw.org/world-report/2026/country-chapters/zimbabwe)). Physical observation of a person is outside what an app can defend.

### F. Legal pressure on groups
| Law | Date | What it does | Source |
|---|---|---|---|
| Criminal Law (Codification and Reform) Amendment Act ("Patriotic Act") | Signed 14 Jul 2023 | Criminalised "wilfully injuring the sovereignty and national interest of Zimbabwe", incl. meetings with foreign governments about sanctions; penalties up to death. **High Court struck down key provisions (s.22A(3) and related) in June 2025** — appeal status **(verify)** | [Amnesty](https://www.amnesty.org/en/latest/news/2023/07/zimbabwe-presidents-signing-of-patriotic-bill-a-brutal-assault-on-civic-space/); [ICTJ](https://www.ictj.org/latest-news/zimbabwe-court-strikes-down-provisions-repressive-law); [HRW 2026](https://www.hrw.org/world-report/2026/country-chapters/zimbabwe) |
| Private Voluntary Organisations Amendment Act (Act No. 1 of 2025) | Signed 11 Apr 2025 | New regulator can deregister organisations deemed "politically partisan", monitor funding and affiliations; criminal penalties; amends several other Acts incl. money-laundering law | [ICNL guide](https://www.icnl.org/post/tools/practical-guide-to-zimbabwes-pvo-act-2025-amendments); [FIDH/OMCT](https://www.fidh.org/en/region/Africa/zimbabwe/zimbabwe-detrimental-private-voluntary-organisations-amendment-bill); [HRW 2026](https://www.hrw.org/world-report/2026/country-chapters/zimbabwe) |
| Cyber and Data Protection Act (Act 5 of 2021) | Dec 2021 | Computer search/seizure powers; online speech offences (see A, B) | [ZimLII](https://zimlii.org/akn/zw/act/2021/5/eng@2022-03-11) |

Implication: records of *who does what role in which group* help prove organisation, affiliation or "partisan" activity. Role names like "press contact" or "legal observer" are sensitive on their own **(verify which role words are risky)**.

## Conditions of use
| Condition | What we know | Design consequence |
|---|---|---|
| Devices | Mostly Android; Samsung the largest brand on the network (~52%), then Huawei, Apple ([Connecting Africa / Econet data](https://www.connectingafrica.com/author.asp?section_id=761&doc_id=767479)); smartphone share of devices ~52% in 2020, older/low-RAM phones common **(verify current figures)** | Test on a low-end Android + Chrome; keep JS and memory small; assume Huawei devices without Google services **(verify PWA install works on them)** |
| Data cost | Among the most expensive mobile data in the world by per-GB ranking (≈ US$43.75/GB, Sept 2023 figure) — contested because of exchange-rate effects ([Mappr / Cable.co.uk](https://www.mappr.co/mobile-data-pricing-by-country/); [Techzim counterpoint](https://www.techzim.co.zw/2022/08/how-zim-data-prices-compare-in-region-not-too-bad/)) **(verify)**; many buy small daily bundles | App shell in tens of KB, not MB. No fonts/images from CDNs. No background sync. Install once, then fully offline |
| Connectivity | Internet use reported at ~82% by POTRAZ (Q2 2025, subscription-based, likely overstates individuals) **(verify)**; frequent power cuts; shutdowns in crises | Offline-first ([0001](decisions/0001-vanilla-pwa-no-build.md)); shares that work without internet (QR, in-person) |
| Messaging | WhatsApp is the default channel for groups **(verify)** | Shares will be pasted into WhatsApp. Treat every share as eventually seized from someone's phone |
| Languages | English, Shona, Ndebele; others in some regions **(verify priority and who translates)** | UI strings in files from day one; short plain words; icons with labels |
| Shared phones | Phones are often shared within families **(verify how common among target users)** | App passphrase separate from the phone PIN; no content in notifications; auto-lock |
| Literacy / tech comfort | Varies widely **(verify)** | One action per screen; panic wipe must be findable under stress but not by accident |

## Mitigations
Status: **done** = in code on `main`; **planned** = accepted in a decision record, not yet built; **proposed** = not yet decided.

| # | Threat | Mitigation | Status | Owner |
|---|---|---|---|---|
| 1 | Server-side identification / subpoena of host | No accounts, no analytics, no backend holding user or team data ([0003](decisions/0003-encrypted-local-storage-auto-delete.md)) | planned (0003) | infra |
| 2 | Host / CDN logs reveal visitor IPs | Choose host with request logging off or minimal; document retention; no third-party requests (fonts, CDNs, analytics) enforced by CSP | proposed | infra |
| 3 | Shutdown / throttling / power cuts | Offline-first PWA; all features work with no network after install | done (0001) | infra |
| 4 | High data cost | Tiny app shell; no external assets; no update pulls beyond changed files | proposed | infra, UI |
| 5 | Seized locked phone | Records encrypted at rest (AES-GCM, PBKDF2 key from passphrase) | planned (0003) | history |
| 6 | Seized phone with long history | 14-day auto-delete; no summaries kept | planned (0003) | history |
| 7 | Old records survive on a never-unlocked phone | Purge-on-unlock gap noted in 0003 — needs a scheme that works without the key (e.g. per-day keys that are dropped) | proposed | history |
| 8 | Arrest imminent | Panic wipe: deletes key and all records | planned (0003) | UI, history |
| 9 | Coerced unlock of the app | **Decoy passphrase** opening a plausible, harmless profile; real data indistinguishable from absent | proposed (deferred in 0003) | history, UI |
| 10 | Phone searched while app open / borrowed | **Auto-lock** after short inactivity and on leaving the app; blank screen in app switcher | proposed | UI |
| 11 | App noticed on home screen / in browser history | **Neutral app name and icon** (e.g. a generic wellbeing/planner name); neutral domain; no "activist" words in manifest, title or URL | proposed | UI, infra |
| 12 | Network observer sees the domain | Neutral domain name; consider a shared/common host domain **(verify options)** | proposed | infra |
| 13 | Phone number = real identity (SIM registration) | **No phone-number identity**, no SMS, no email; team membership only by in-person key exchange | proposed | infra |
| 14 | Leaked schedule from records | No exact timestamps (date + day-part), durations rounded to 30 min; **coarse times** everywhere including shares | planned (record format) | history |
| 15 | Leaked team schedule / infiltrator holds a share | v1 teams share no schedule or roles at all: only an aggregate low count and opt-in `ok`/`low` bands, expiring after 48h ([0005](decisions/0005-teams-status-covenant.md)); see [Teams (0005)](#teams-0005) | planned (0005) | history, infra |
| 16 | Share link found in a seized WhatsApp chat | Share encrypted, key in URL fragment, short expiry, no names; prefer QR shown in person | proposed ([ideas](ideas.md)) | infra |
| 17 | Role names prove organisation (PVO / Patriotic Act) | Teams choose their own role labels; defaults are neutral ("Role A", "Contact", "Support") | proposed | UI |
| 18 | Diary as dossier / online speech offences | No free text, no locations, no names in records | planned (record format) | history |
| 19 | Activity type labels incriminate (e.g. "action") | Neutral display labels; keep internal code values out of the UI | proposed | UI, history |
| 20 | Individual state leaks to team | Battery level and history never leave the device; only an opt-in `ok`/`low` band, off by default ([0005](decisions/0005-teams-status-covenant.md)) | planned (0005) | UI, history |
| 21 | Shared phone notifications | No notifications in v1; if added later, content-free | proposed | UI |

## Residual risks we can NOT solve
- **Coerced unlock of a live session.** If someone is forced to open the app and hand it over, they see what the user sees. A decoy helps only if the user can choose it under pressure and it is believable.
- **Compromised OS or spyware.** A rooted phone, malicious app, or state implant sees everything on screen and every keystroke, including the passphrase.
- **Observation of the person, not the phone.** Being followed, informers, photographs, a team member talking. The app cannot hide where someone physically is.
- **Hosting provider and ISPs see IPs and the domain.** Even with no user data stored, a request to our domain from a phone at a time is visible to the network and the host at connection time.
- **Other apps on the same phone.** WhatsApp chats, gallery, call logs, contacts reveal far more than we store. We can advise, not control.
- **Weak passphrases.** PBKDF2 on a short passphrase can be brute-forced offline from a copied phone image.
- **Deleted is not always gone.** Flash storage and browser internals may keep fragments after wipe; we cannot guarantee forensic erasure from a web app **(verify with history engineer)**.
- **Law changes and new powers** (e.g. regulations under the PVO Act) may create new obligations we cannot anticipate.

## New requirements this implies
**UI**
- Neutral name, icon, page title and install prompt; no activist vocabulary on first screen.
- Auto-lock (default ≤ 1 min idle and on visibility change); blank/neutral view when backgrounded.
- Panic wipe reachable in ≤ 2 taps from any screen, with a confirmation that is not a long ceremony; nothing on screen afterwards suggests a wipe happened.
- Editable role labels with neutral defaults; neutral activity labels.
- Decoy passphrase flow (design now even if built later).
- All strings in locale files (en, sn, nd).

**History / storage**
- Solve purge-without-key (item 7), e.g. per-day or per-week keys that are deleted on schedule.
- Decoy profile storage that is indistinguishable from real (same sizes/shape).
- Passphrase strength guidance and a high PBKDF2 iteration count tuned for low-end phones.
- Confirm what IndexedDB wipe actually removes on Android Chrome.

**Infra**
- Neutral domain; host with logging off/minimal and documented retention.
- Strict CSP: no third-party origins at all.
- App shell size budget (target < 150 KB) **(verify target with UI)**.
- Share format: encrypted, fragment key, expiry, no names, no phone numbers; QR works fully offline.

## Teams (0005)
Reviews [0005](decisions/0005-teams-status-covenant.md) and [team-protocol.md](team-protocol.md). Teams move us from "one phone, one person" to "one phone holds something about everyone". The core fact: **every member phone holds the team key, and the key never changes (v1).** So one seized-and-unlocked phone, one infiltrator or one person who left can read every team QR code they can see or photograph, now or later.

### New assets
| Asset | Where it lives | Who can read it |
|---|---|---|
| Team key (AES-256) | Every member phone, invite QR | Any member, anyone with an unlocked member phone, anyone with invite QR + spoken code |
| Covenant text + team name (free text) | Every member phone, indefinitely | Same as the key |
| Latest summary: team size present, low count, opted-in pseudonyms + band, date | Every member phone, 48h | Same as the key |
| Individual `low` bit (all members, opt-in or not) | Status QR during a check-in | The runner, **and any key holder who photographs the QR** (sealed with the team key) |
| Invite QR + spoken join code | Leader's screen, the room | Anyone who sees the QR and hears the code |
| The fact a group met | Summary `date`, the check-in itself | Anyone with an unlocked phone; anyone watching the room |

### Threats and mitigations
Status as in the table above; **recommended** = proposed here, not yet agreed.

| # | Threat | Mitigation | Status |
|---|---|---|---|
| T1 | Member phone seized and unlocked (coerced) | Summary expires after 48h; no history of past check-ins; team doc encrypted at rest; panic wipe clears `docs` store | planned (0005, protocol) |
| T2 | …and the key on it decrypts QR photos taken before or after (CCTV, a phone camera at a check-in) | None in v1: key is static. See R1 (status forward secrecy) and R2 (start-fresh rotation) | **gap** |
| T3 | Infiltrator joins | Joining needs physical presence + spoken code; covenant as a social gate. An infiltrator then sees summaries and opted-in bands — never levels, activities or schedules | planned (0005) |
| T4 | Infiltrator (or any member) photographs status QRs and reads everyone's `low` bit, including people who did not opt in | None: status QRs are sealed with the team key everyone holds | **gap — R1** |
| T5 | Invite QR photographed | Sealed with ~50-bit join code, PBKDF2 600k: offline guessing infeasible | planned (protocol) |
| T6 | Invite QR photographed **and** code overheard | Equals handing over the team key forever. Mitigate by R4 (short display, one invite per person) | partial |
| T7 | Person who left, or was removed, keeps the key | None in v1 ("rotation → future decision") | **gap — R2** |
| T8 | Check-in runner sees each member's `low` bit | Accepted in 0005 ("same as asking out loud"); snapshots discarded after Finish | accepted |
| T9 | Small-group aggregate reveals individuals. At total = 3, low = 0 or 3 tells everyone each person's state; two check-ins on one day with different people reveal the difference | Hidden when total < 3 | partial — R3 |
| T10 | Team size and meeting date on a seized phone (`total`, `date`, `expires`) prove a group of N met on a given day | 48h expiry | residual — R6 |
| T11 | Covenant / team name typed in activist terms is the most incriminating text on the phone, kept indefinitely on every member phone | None in protocol (free text, ≤200 / ≤80 chars) | **gap — R5** |
| T12 | Pseudonyms chosen as real names or known nicknames | None | **gap — R7** |
| T13 | Paste fallback moves codes into WhatsApp/SMS/clipboard history, where any key holder can read them long after 48h (expiry is only enforced by our app) | Neutral prefixes (`j1`/`s1`/`c1`), no app name in QR text | partial — R8 |
| T14 | Key holder forges a summary or stuffs a check-in with extra snapshots | Nonce de-duplication, teamId + date checks | residual (integrity, low harm) — runner sees scan count vs people in the room |
| T15 | UI labels one person as "leader"/"admin", marking the organiser on their phone | Protocol stores no role; only UI wording matters | **recommended** — R9 |

### Recommended protocol changes before shipping
In priority order. None rewrites the protocol file; owners decide.

- **R1 — Seal status snapshots to the check-in, not the team (fixes T2, T4).** Runner taps *Run check-in* → shows a *start* QR (kind `k`, sealed with the team key) holding a fresh ECDH P-256 public key. Each member scans it; their phone derives a shared AES-GCM key from its own fresh ECDH pair (WebCrypto, no dependency) and seals `s` to it, including its own public key. On *Finish* the runner's private key is deleted. Result: only the runner can read statuses, and only during the check-in; photos of status QRs are useless afterwards, even to someone who later gets the team key. Cost: one extra scan per member. (Summary stays on the team key so everyone can read it.)
- **R2 — "Start fresh" as v1 rotation (fixes T7, limits T2).** A one-tap flow: create a new team with the same covenant, new key and id; delete the old team; re-invite everyone in person. Uses existing `createTeam`/invite. UI advice: use it after any member is arrested, loses their phone, or leaves on bad terms.
- **R3 — Coarse aggregate for small groups (limits T9).** Raise the threshold to **4**, or show words not numbers below 6 (e.g. "none / a few / many of us are running low") **(team decision)**. Everyone present at two check-ins on one day can still compare them; advise one check-in per day.
- **R4 — Invite handling (limits T6).** Auto-hide the invite QR after 2 min and on leaving the screen; new join code each time it is shown (already); show the code on the inviter's screen only on tap, so it is spoken, not left visible next to the QR; one invite per newcomer.
- **R5 — Covenant and name stay neutral (limits T11).** Show the placeholder copy in [covenant-prompts.md](covenant-prompts.md) as defaults and hints; add a one-line hint under the fields ("Write about how you look after each other, not about your work"). Consider not storing the covenant on member phones after joining: show it at join, keep only a hash to confirm it matches **(team decision — trades culture visibility for safety)**.
- **R6 — Minimise dates and size in the stored summary (limits T10).** Drop `date` from the stored copy (keep `expires` only), show "earlier today / yesterday" in UI. Consider storing only the bucket from R3 instead of `total`.
- **R7 — Generated pseudonyms by default (fixes T12).** Offer a random pick from a neutral word list (birds, trees); editable, with a hint "not your real name or nickname".
- **R8 — No copy/share buttons (limits T13).** Status, summary and invite codes are shown as QR only; the paste field accepts input but the app never offers to copy or share a code. Warn in the paste fallback: "Don't send this in a chat."
- **R9 — Neutral roles in UI (fixes T15).** No "leader", "admin" or "founder" labels; "started this group" is not stored or shown after creation. "Run check-in" is fine: anyone can do it.
- **R10 — Consent text for opt-in band.** When turning on *Share my status*: "Everyone in this group — and anyone who gets into their phone — will see 'ok' or 'low' next to your name for 2 days."

### Residual risks (teams)
- **The check-in is itself observable.** A group holding phones up to each other is a gathering; the app cannot hide that people met.
- **Any member is a full-access member.** v1 has no roles or permissions; an infiltrator sees exactly what everyone sees until the team starts fresh.
- **Coerced member reveals everything they know**, with or without the phone: who is in the group, who opted in, the covenant.
- **Pseudonyms are linkable in person.** In a small group everyone knows who "Heron" is; pseudonyms protect only against someone who has the phone but not the people.
- **Runner knowledge.** The runner learns everyone's `low` bit at every check-in; R1 limits it to the runner, not below.
- **Forged or stuffed summaries** from a key holder can mislead the team (T14).
- **PBKDF2 600k on low-end phones** may take several seconds per join **(verify timing on a target phone)**.

## Open questions for the activist
1. How often are phones actually searched at roadblocks or on arrest, and are people forced to unlock the phone, specific apps, or both?
2. Would a decoy passphrase be believable and usable under pressure, or does it add risk if discovered?
3. What app name and icon would look ordinary on a Zimbabwean activist's phone?
4. Which role names or activity words are dangerous to have on a phone after the PVO Amendment Act? What neutral words do groups already use?
5. How do teams actually share schedules today (WhatsApp, Signal, paper, in person)? Is a QR shown in person realistic?
6. Is a 48–72h coverage window too long or too short? Is even "who covers what" too sensitive to share?
7. How common are shared phones among likely users, and who else might open the app?
8. Typical phones: brand, Android version, storage free, Huawei without Google services?
9. Language priorities, and who can translate and review Shona and Ndebele text safely?
10. Is 14 days of history too much? Would 7 days still make the battery useful?
11. Are there trusted local digital-security organisations we should ask to review this (without sharing it publicly)?
12. Is infiltration of teams a documented pattern we can cite, or only anecdotal?
13. Teams: is a physical check-in (people scanning each other's phones) safe to do in the places teams meet, or does it draw attention?
14. Would teams use "Start fresh" after an arrest, or is re-inviting everyone in person too hard?
15. Is sharing a `low` band with the whole group culturally comfortable, or would people prefer to tell only the runner?
16. How small are real teams? If most are 3–5 people, the aggregate count reveals individuals (T9).
