#!/usr/bin/env node
// Checks that APP_SHELL in sw.js lists exactly the files the app needs offline.
// Usage: node scripts/check-shell.mjs   (exits 1 and names each problem file)
// Zero dependencies: Node built-ins only.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const toPosix = (p) => p.split(sep).join('/');

// Files that must be in APP_SHELL.
const REQUIRED_FILES = ['index.html', 'manifest.webmanifest', 'mock/activities.json'];
const REQUIRED_DIRS = ['src', 'icons'];
// Entries allowed in APP_SHELL that are not files on disk.
const NON_FILE_ENTRIES = new Set(['./']);

function walk(dir) {
  const abs = join(root, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .filter((name) => !name.startsWith('.')) // skip .DS_Store, .gitkeep etc.
    .flatMap((name) => {
      const rel = toPosix(join(dir, name));
      return statSync(join(root, rel)).isDirectory() ? walk(rel) : [rel];
    });
}

function readAppShell() {
  const source = readFileSync(join(root, 'sw.js'), 'utf8');
  const match = source.match(/const APP_SHELL\s*=\s*\[([\s\S]*?)\];/);
  if (!match) {
    console.error('check-shell: could not find `const APP_SHELL = [...]` in sw.js');
    process.exit(1);
  }
  const body = match[1].replace(/\/\/.*$/gm, ''); // drop line comments
  return [...body.matchAll(/(['"`])(.*?)\1/g)].map((m) => m[2]);
}

const shell = readAppShell();
const shellSet = new Set(shell.map((p) => p.replace(/^\.\//, '') || './'));
const required = [...REQUIRED_FILES.filter((f) => existsSync(join(root, f))), ...REQUIRED_DIRS.flatMap(walk)];

const missing = required.filter((f) => !shellSet.has(f)).sort();
const nonexistent = shell
  .filter((entry) => !NON_FILE_ENTRIES.has(entry))
  .filter((entry) => {
    const abs = join(root, entry);
    return !existsSync(abs) || !statSync(abs).isFile();
  });
const duplicates = shell.filter((entry, i) => shell.indexOf(entry) !== i);
const outside = shell.filter((entry) => relative(root, join(root, entry)).startsWith('..'));

let failed = false;
const report = (title, list) => {
  if (list.length === 0) return;
  failed = true;
  console.error(`${title}:`);
  for (const item of list) console.error(`  - ${item}`);
};

report('Missing from APP_SHELL in sw.js (add them and bump CACHE)', missing);
report('Listed in APP_SHELL but not a file on disk', nonexistent);
report('Listed in APP_SHELL more than once', [...new Set(duplicates)]);
report('Listed in APP_SHELL but outside the app root', outside);

if (failed) process.exit(1);
console.log(`check-shell: OK (${shell.length} APP_SHELL entries, ${required.length} required files covered)`);
