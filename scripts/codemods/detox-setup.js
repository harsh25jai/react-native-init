#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { DETOX_MODS, DETOX_FILES } = require('./detox-config');

const ROOT_ARG = process.argv.find(arg => arg.startsWith('--root='));
const ROOT = ROOT_ARG ? path.resolve(ROOT_ARG.split('=')[1]) : process.cwd();
const DRY_RUN = process.argv.includes('--dry-run');
const NO_GIT = process.argv.includes('--no-git');

/**
 * Report state
 */
const report = {
  created: [],
  modified: [],
  skipped: [],
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
  // Try Manifest first
  const manifestPath = resolvePath('android/app/src/main/AndroidManifest.xml');
  if (fs.existsSync(manifestPath)) {
    const manifest = fs.readFileSync(manifestPath, 'utf8');
    const m = manifest.match(/package="([^"]+)"/);
    if (m && m[1]) return m[1];
  }

  // Try build.gradle namespace
  const gradlePath = resolvePath('android/app/build.gradle');
  if (fs.existsSync(gradlePath)) {
    const gradle = fs.readFileSync(gradlePath, 'utf8');
    const m = gradle.match(/namespace\s+['"]([^'"]+)['"]/);
    if (m && m[1]) return m[1];
    const appIdMatch = gradle.match(/applicationId\s+['"]([^'"]+)['"]/);
    if (appIdMatch && appIdMatch[1]) return appIdMatch[1];
  }

  return 'com.reactnativeinit'; // final fallback
}

/**
 * Detect App Name from app.json or package.json
 */
function getAppName() {
  const appJsonPath = resolvePath('app.json');
  if (fs.existsSync(appJsonPath)) {
    try {
      const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      if (appJson.name) return appJson.name;
    } catch (e) { }
  }

  const pkgPath = resolvePath('package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.name) return pkg.name;
    } catch (e) { }
  }

  return 'reactNativeInit'; // fallback
}

/**
 * Get comment style based on file extension
 */
function getComment(text, filePath) {
  const ext = path.extname(filePath);
  if (ext === '.xml') {
    return `<!-- ${text} -->`;
  }
  return `// ${text}`;
}

/**
 * Idempotent file patcher
 */
function applyPatches(fileMod) {
  const fullPath = resolvePath(fileMod.path);
  if (!fs.existsSync(fullPath)) {
    report.skipped.push(`${fileMod.path} (not found)`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  fileMod.patches.forEach(patch => {
    if (content.includes(patch.id)) {
      return; // Already applied
    }

    const updated = content.replace(patch.hook, (match) => {
      changed = true;
      const tag = getComment(`[${patch.id}]`, fileMod.path);
      return patch.transform(match) + `\n        ${tag}`;
    });

    if (updated !== content) {
      content = updated;
    } else {
      report.errors.push(`Failed to match hook for patch ${patch.id} in ${fileMod.path}`);
    }
  });

  if (changed) {
    if (!DRY_RUN) {
      fs.writeFileSync(fullPath, content, 'utf8');
    }
    report.modified.push(fileMod.path);
  } else {
    report.skipped.push(fileMod.path);
  }
}

/**
 * File creator
 */
function createFiles(fileObj) {
  const fullPath = resolvePath(fileObj.path);
  if (fs.existsSync(fullPath)) {
    report.skipped.push(`${fileObj.path} (exists)`);
    return;
  }

  if (!DRY_RUN) {
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, fileObj.content, 'utf8');
  }
  report.created.push(fileObj.path);
}

/**
 * Git integration
 */
function stageChanges() {
  if (NO_GIT) return;

  const gitCheck = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { encoding: 'utf8', cwd: ROOT });
  if (gitCheck.status !== 0) return;

  console.log('\n📦 Staging changes in git...');
  spawnSync('git', ['add', '.'], { stdio: 'inherit', cwd: ROOT });
}

/**
 * Execution
 */
(async () => {
  console.log(`🚀 Starting Detox setup ${DRY_RUN ? '(DRY RUN)' : ''}...`);

  const packageName = getPackageName();
  const appName = getAppName();
  console.log(`📦 Detected Android Package: ${packageName}`);
  console.log(`📱 Detected App Name: ${appName}`);

  // 1. Create Files
  DETOX_FILES(packageName, appName).forEach(createFiles);

  // 2. Patch Files
  DETOX_MODS.forEach(applyPatches);

  // 3. Stage
  if (!DRY_RUN) {
    stageChanges();
  }

  // Final Report
  console.log('\n--- Setup Report ---');
  console.log(`✅ Created:  ${report.created.length}`);
  report.created.forEach(f => console.log(`   + ${f}`));
  console.log(`✅ Modified: ${report.modified.length}`);
  report.modified.forEach(f => console.log(`   ~ ${f}`));
  console.log(`ℹ️  Skipped:  ${report.skipped.length}`);

  if (report.errors.length > 0) {
    console.log('\n❌ Warnings/Errors:');
    report.errors.forEach(e => console.log(`   ! ${e}`));
  }

  console.log('\n✨ Detox setup completed.');
})();
