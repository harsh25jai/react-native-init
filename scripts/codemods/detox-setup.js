#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_ARG = process.argv.find(arg => arg.startsWith('--root='));
const ROOT = ROOT_ARG ? path.resolve(ROOT_ARG.split('=')[1]) : process.cwd();
const DRY_RUN = process.argv.includes('--dry-run');
const NO_GIT = process.argv.includes('--no-git');

/**
 * Report state
 */
const report = {
  applied: false,
  errors: []
};

/**
 * Resolve absolute path
 */
function resolvePath(relPath) {
  return path.join(ROOT, relPath);
}

/**
 * Robust Android package name detection
 */
function getPackageName() {
  const manifestPath = resolvePath('android/app/src/main/AndroidManifest.xml');
  if (fs.existsSync(manifestPath)) {
    const manifest = fs.readFileSync(manifestPath, 'utf8');
    const m = manifest.match(/package="([^"]+)"/);
    if (m && m[1]) return m[1];
  }

  const gradlePath = resolvePath('android/app/build.gradle');
  if (fs.existsSync(gradlePath)) {
    const gradle = fs.readFileSync(gradlePath, 'utf8');
    const m = gradle.match(/namespace\s+['"]([^'"]+)['"]/);
    if (m && m[1]) return m[1];
    const appIdMatch = gradle.match(/applicationId\s+['"]([^'"]+)['"]/);
    if (appIdMatch && appIdMatch[1]) return appIdMatch[1];
  }

  return 'com.reactnativeinit';
}

/**
 * Detect App Name
 */
function getAppName() {
  const appJsonPath = resolvePath('app.json');
  if (fs.existsSync(appJsonPath)) {
    try {
      const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      if (appJson.name) return appJson.name;
    } catch (e) { }
  }
  return 'reactNativeInit';
}

/**
 * Execution
 */
(async () => {
  console.log(`🚀 Starting Templated Detox setup ${DRY_RUN ? '(DRY RUN)' : ''}...`);

  const packageName = getPackageName();
  const packagePath = packageName.replace(/\./g, '/');
  const appName = getAppName();

  console.log(`📦 Package: ${packageName}`);
  console.log(`📱 App Name: ${appName}`);

  const patchPath = path.join(__dirname, '..', 'patches', 'detox-setup.patch');
  if (!fs.existsSync(patchPath)) {
    console.error('❌ Error: detox-setup.patch not found');
    process.exit(1);
  }

  let patchContent = fs.readFileSync(patchPath, 'utf8');
  patchContent = patchContent
    .replace(/__APP_NAME__/g, appName)
    .replace(/__PACKAGE_NAME__/g, packageName)
    .replace(/__PACKAGE_PATH__/g, packagePath);

  const tmpPatch = path.join(ROOT, '.detox-setup.tmp.patch');
  fs.writeFileSync(tmpPatch, patchContent, 'utf8');

  try {
    const checkArgs = ['apply', '--check', '--whitespace=nowarn', tmpPatch];
    const check = spawnSync('git', checkArgs, { cwd: ROOT, encoding: 'utf8' });

    if (check.status !== 0) {
      console.error('❌ Patch compatibility check failed.');
      console.error(check.stderr || check.stdout);
      process.exit(1);
    }

    if (DRY_RUN) {
      console.log('✅ Dry run completed. Patch is compatible.');
    } else {
      const applyArgs = ['apply', '--whitespace=nowarn', tmpPatch];
      const apply = spawnSync('git', applyArgs, { cwd: ROOT, stdio: 'inherit' });

      if (apply.status === 0) {
        console.log('✅ Detox setup patch applied successfully.');
        if (!NO_GIT) {
          spawnSync('git', ['add', '.'], { cwd: ROOT, stdio: 'inherit' });
          console.log('📦 Changes staged in git.');
        }
      } else {
        console.error('❌ Failed to apply patch.');
        process.exit(1);
      }
    }
  } finally {
    if (fs.existsSync(tmpPatch)) fs.unlinkSync(tmpPatch);
  }

  console.log('\n✨ Detox setup completed.');
})();
