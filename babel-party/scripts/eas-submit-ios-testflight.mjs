#!/usr/bin/env node
/**
 * Submits an iOS build to App Store Connect.
 *
 * - Default: `eas submit --latest` (last **cloud** EAS build).
 * - Local .ipa: `EAS_SUBMIT_IPA_PATH=/path/to/app.ipa npm run submit:ios-testflight`
 *
 * Note: `--what-to-test` (TestFlight changelog) requires an EAS Enterprise plan.
 * Set EAS_SUBMIT_WHAT_TO_TEST=1 to opt in; otherwise paste notes manually in App Store Connect.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pathNotes = join(root, 'testflight-what-to-test.txt');

const ipaPath = process.env.EAS_SUBMIT_IPA_PATH?.trim();
const submitArgs = ['eas-cli@latest', 'submit', '-p', 'ios', '--profile', 'production', '--non-interactive'];

if (ipaPath) {
  submitArgs.push('--path', ipaPath);
} else {
  submitArgs.push('--latest');
}

if (process.env.EAS_SUBMIT_WHAT_TO_TEST === '1') {
  const whatToTest = readFileSync(pathNotes, 'utf8').trim();
  if (!whatToTest.length) {
    console.error(`Empty or missing: ${pathNotes}`);
    process.exit(1);
  }
  submitArgs.push('--what-to-test', whatToTest);
} else {
  console.log(
    'Skipping --what-to-test (Enterprise-only). Paste notes from testflight-what-to-test.txt in App Store Connect.',
  );
}

const r = spawnSync('npx', submitArgs, { stdio: 'inherit', cwd: root });

process.exit(r.status ?? 1);
