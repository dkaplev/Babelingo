#!/usr/bin/env node
/**
 * Bumps the user-facing semver in app.json (expo.version) and package.json.
 *
 *   patch — bug fixes / technical (1.0.3 → 1.0.4)
 *   minor — product / new features (1.0.3 → 1.1.0)
 *
 * iOS buildNumber / Android versionCode are still auto-incremented by EAS
 * (see eas.json production.autoIncrement). After a local auto-increment build,
 * commit any app.json changes EAS wrote.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2];

if (mode !== 'patch' && mode !== 'minor') {
  console.error('Usage: node scripts/bump-app-version.mjs patch|minor');
  process.exit(1);
}

const appPath = join(root, 'app.json');
const pkgPath = join(root, 'package.json');

const app = JSON.parse(readFileSync(appPath, 'utf8'));
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

const current = app.expo?.version;
if (typeof current !== 'string') {
  console.error('Missing expo.version in app.json');
  process.exit(1);
}

const parts = current.split('.').map((p) => parseInt(p, 10));
if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
  console.error(`Expected semver major.minor.patch, got: ${current}`);
  process.exit(1);
}

let [major, minor, patch] = parts;
if (mode === 'patch') {
  patch += 1;
} else {
  minor += 1;
  patch = 0;
}

const next = `${major}.${minor}.${patch}`;
app.expo.version = next;
pkg.version = next;

writeFileSync(appPath, `${JSON.stringify(app, null, 2)}\n`);
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

console.log(`Bumped user-facing version ${current} → ${next} (${mode} release).`);
console.log('Next: git commit app.json + package.json, then eas build --platform ios --profile production');
