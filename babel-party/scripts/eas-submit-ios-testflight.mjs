#!/usr/bin/env node
/**
 * Submits an iOS build to App Store Connect and sets TestFlight "What to Test"
 * from ../testflight-what-to-test.txt (see eas submit --help).
 *
 * - Default: `eas submit --latest` (last **cloud** EAS build).
 * - Local .ipa: `EAS_SUBMIT_IPA_PATH=/path/to/app.ipa npm run submit:ios-testflight`
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

const ipaPath = process.env.EAS_SUBMIT_IPA_PATH?.trim();
const submitArgs = ['eas-cli@latest', 'submit', '-p', 'ios', '--profile', 'production', '--what-to-test', whatToTest];
if (ipaPath) {
  submitArgs.push('--path', ipaPath);
} else {
  submitArgs.push('--latest');
}

const r = spawnSync('npx', submitArgs, { stdio: 'inherit', cwd: root });

process.exit(r.status ?? 1);
