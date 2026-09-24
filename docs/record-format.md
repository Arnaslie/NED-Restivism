# Activity record format (draft v1)

Owner: history engineer. Contract for UI, battery and storage. Records are only ever stored encrypted (see [0003](decisions/0003-encrypted-local-storage-auto-delete.md)).

```js
{
  id: "b3f1…",              // random UUID (crypto.randomUUID)
  v: 1,                     // schema version
  date: "2026-09-22",       // day only — no exact timestamps
  dayPart: "morning",       // morning | afternoon | evening | night
  type: "action",           // action | meeting | travel | support | admin | rest | sleep
  durationMin: 120,         // rounded to 30
  intensity: 2,             // 1 light · 2 moderate · 3 heavy
  selfCheck: 4,             // optional, 1 (fresh) – 5 (drained)
  biomarkers: {             // optional
    cortisolNmolL: 18.2,    // salivary cortisol
    source: "mock"          // mock | manual — only "mock" exists in v1
  }
}
```

## Deliberately absent
- **Location** of any kind
- **Free-text notes** (a diary is an intelligence dossier)
- **Names** or other people involved
- **Exact times**

## Mock data
[`mock/activities.json`](../mock/activities.json) holds 14 days of synthetic records for one fictional user, including mock cortisol. Mock cortisol values are illustrative only — not clinically meaningful. Never replace them with real readings in the repo.

## Validation rules (enforced by `src/store/record.js`)
- Only the fields above are accepted; anything else (location, notes, names, times…) is rejected, including inside `biomarkers`.
- `date`: a real calendar date, `YYYY-MM-DD`. `dayPart` and `type`: one of the listed values.
- `durationMin`: integer, positive multiple of 30, at most 1440. `intensity`: integer 1–3.
- `selfCheck` (optional): integer 1–5. `biomarkers` (optional): `source` is `mock` or `manual`, `cortisolNmolL` a number 0–1000.
- `id` and `v` are assigned by `save()`, never by the caller.
- Retention: a record is purged when its `date` is more than 14 days before the device's local date (today − 14 is kept).
