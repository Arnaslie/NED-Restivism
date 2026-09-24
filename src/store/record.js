// Pure record logic: validation, ordering and retention date math.
// No DOM, no storage — runs in the browser and in Node tests.
// Format: docs/record-format.md

export const SCHEMA_VERSION = 1;
export const RETENTION_DAYS = 14;

export const DAY_PARTS = ['morning', 'afternoon', 'evening', 'night'];
export const TYPES = ['action', 'meeting', 'travel', 'support', 'admin', 'rest', 'sleep'];
export const BIOMARKER_SOURCES = ['mock', 'manual'];

const INPUT_FIELDS = ['date', 'dayPart', 'type', 'durationMin', 'intensity', 'selfCheck', 'biomarkers'];
const STORED_FIELDS = ['id', 'v', ...INPUT_FIELDS];
const BIOMARKER_FIELDS = ['cortisolNmolL', 'source'];
const MAX_DURATION_MIN = 24 * 60;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

// "YYYY-MM-DD" -> UTC day number, or NaN if not a real calendar date.
export function dayNumber(date) {
  const m = typeof date === 'string' && DATE_RE.exec(date);
  if (!m) return NaN;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = Date.UTC(y, mo - 1, d);
  const back = new Date(t);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return NaN;
  return t / 86400000;
}

export function fromDayNumber(n) {
  return new Date(n * 86400000).toISOString().slice(0, 10);
}

// The device's local calendar date for a Date, as "YYYY-MM-DD".
export function localDate(today = new Date()) {
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Oldest date that is kept: exactly RETENTION_DAYS before today.
export function retentionCutoff(today = new Date()) {
  return fromDayNumber(dayNumber(localDate(today)) - RETENTION_DAYS);
}

// True when the record's date is more than RETENTION_DAYS before today.
export function isExpired(record, today = new Date()) {
  return record.date < retentionCutoff(today);
}

export function compareRecords(a, b) {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return DAY_PARTS.indexOf(a.dayPart) - DAY_PARTS.indexOf(b.dayPart);
}

function fail(msg) {
  throw new Error(`Invalid activity: ${msg}`);
}

function isPlainObject(x) {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

function rejectUnknown(obj, allowed, where) {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) fail(`${where}"${key}" is not allowed (no notes, names, places or times)`);
  }
}

function checkInt(value, name, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) fail(`${name} must be a whole number from ${min} to ${max}`);
}

// Validates user-entered fields (no id/v) and returns a clean copy with only known fields.
export function validateFields(fields) {
  if (!isPlainObject(fields)) fail('expected an object');
  rejectUnknown(fields, INPUT_FIELDS, '');

  const { date, dayPart, type, durationMin, intensity, selfCheck, biomarkers } = fields;
  if (Number.isNaN(dayNumber(date))) fail('date must be a real date as YYYY-MM-DD');
  if (!DAY_PARTS.includes(dayPart)) fail(`dayPart must be one of ${DAY_PARTS.join(', ')}`);
  if (!TYPES.includes(type)) fail(`type must be one of ${TYPES.join(', ')}`);
  if (!Number.isInteger(durationMin) || durationMin <= 0 || durationMin % 30 !== 0 || durationMin > MAX_DURATION_MIN) {
    fail('durationMin must be a positive multiple of 30, at most 24 hours');
  }
  checkInt(intensity, 'intensity', 1, 3);

  const out = { date, dayPart, type, durationMin, intensity };

  if (selfCheck !== undefined) {
    checkInt(selfCheck, 'selfCheck', 1, 5);
    out.selfCheck = selfCheck;
  }

  if (biomarkers !== undefined) {
    if (!isPlainObject(biomarkers)) fail('biomarkers must be an object');
    rejectUnknown(biomarkers, BIOMARKER_FIELDS, 'biomarkers.');
    const { cortisolNmolL, source } = biomarkers;
    if (!BIOMARKER_SOURCES.includes(source)) fail(`biomarkers.source must be one of ${BIOMARKER_SOURCES.join(', ')}`);
    if (typeof cortisolNmolL !== 'number' || !Number.isFinite(cortisolNmolL) || cortisolNmolL < 0 || cortisolNmolL > 1000) {
      fail('biomarkers.cortisolNmolL must be a number from 0 to 1000');
    }
    out.biomarkers = { cortisolNmolL, source };
  }

  return out;
}

// Validates a full stored record (id + v + fields). Used when reading back.
export function validateRecord(record) {
  if (!isPlainObject(record)) fail('expected an object');
  rejectUnknown(record, STORED_FIELDS, '');
  const { id, v, ...fields } = record;
  if (typeof id !== 'string' || id.length === 0) fail('id missing');
  if (v !== SCHEMA_VERSION) fail(`unsupported schema version ${v}`);
  return { id, v, ...validateFields(fields) };
}

export function createRecord(fields, uuid = () => crypto.randomUUID()) {
  return { id: uuid(), v: SCHEMA_VERSION, ...validateFields(fields) };
}
