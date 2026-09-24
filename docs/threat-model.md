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
| 15 | Leaked team schedule / infiltrator holds a share | Shares carry near-term role coverage only (48–72h, day-parts, expiring); never rest, battery or history ([0002](decisions/0002-personal-battery-on-device.md)) | planned (0002) | infra |
| 16 | Share link found in a seized WhatsApp chat | Share encrypted, key in URL fragment, short expiry, no names; prefer QR shown in person | proposed ([ideas](ideas.md)) | infra |
| 17 | Role names prove organisation (PVO / Patriotic Act) | Teams choose their own role labels; defaults are neutral ("Role A", "Contact", "Support") | proposed | UI |
| 18 | Diary as dossier / online speech offences | No free text, no locations, no names in records | planned (record format) | history |
| 19 | Activity type labels incriminate (e.g. "action") | Neutral display labels; keep internal code values out of the UI | proposed | UI, history |
| 20 | Individual state leaks to team | Battery on-device only; team sees "<role> needs cover", never why | planned (0002) | UI |
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
