#!/usr/bin/env node
/**
 * Submits the latest EAS iOS build to App Store Connect and sets TestFlight
 * "What to Test" from ../testflight-what-to-test.txt (see eas submit --help).
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pathNotes = join(root, 'testflight-what-to-test.txt');
const whatToTest = readFileSync(pathNotes, 'utf8').trim();

if (!whatToTest.length) {
  console.error(`Empty or missing: ${pathNotes}`);
  process.exit(1);
}

const r = spawnSync(
  'npx',
  ['eas-cli@latest', 'submit', '-p', 'ios', '--latest', '--what-to-test', whatToTest],
  { stdio: 'inherit', cwd: root },
);

process.exit(r.status ?? 1);
