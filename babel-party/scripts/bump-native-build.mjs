#!/usr/bin/env node
/**
 * Increments iOS expo.ios.buildNumber and Android expo.android.versionCode only.
 * User-facing expo.version is unchanged (use npm run version:patch / version:minor).
 *
 * Use when:
 *   - App Store Connect rejects "build number already exists"
 *   - You use local/Xcode builds without EAS writing back to app.json
 *   - You want the repo to match what you are about to upload
 *
 * EAS production profile has autoIncrement: true — cloud/local EAS builds may still
 * bump at compile time; committing the result after a successful build keeps git honest.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appPath = join(root, 'app.json');
const app = JSON.parse(readFileSync(appPath, 'utf8'));

const iosRaw = app.expo?.ios?.buildNumber;
const androidRaw = app.expo?.android?.versionCode;
const iosN = typeof iosRaw === 'string' ? parseInt(iosRaw, 10) : Number(iosRaw);
const androidN = typeof androidRaw === 'number' ? androidRaw : parseInt(String(androidRaw), 10);

if (Number.isNaN(iosN) || iosN < 1) {
  console.error('Invalid or missing expo.ios.buildNumber in app.json');
  process.exit(1);
}
if (Number.isNaN(androidN) || androidN < 1) {
  console.error('Invalid or missing expo.android.versionCode in app.json');
  process.exit(1);
}

const nextIos = iosN + 1;
const nextAndroid = androidN + 1;

app.expo.ios.buildNumber = String(nextIos);
app.expo.android.versionCode = nextAndroid;

writeFileSync(appPath, `${JSON.stringify(app, null, 2)}\n`);

console.log(`Native build counters bumped:`);
console.log(`  iOS buildNumber     ${iosN} → ${nextIos}`);
console.log(`  Android versionCode ${androidN} → ${nextAndroid}`);
console.log('Next: commit app.json if you want this recorded, then run your EAS/Xcode build.');
