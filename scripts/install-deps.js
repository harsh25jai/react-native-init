#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const prompts = require('prompts');
const { spawnSync } = require('child_process');

const DEPS = require('./deps.config');

const pkgPath = path.join(process.cwd(), 'package.json');

/**
 * Read package.json safely
 */
function readPackageJson() {
  if (!fs.existsSync(pkgPath)) {
    console.error('❌ package.json not found');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
}

/**
 * Check if dependency already exists
 */
function isAlreadyInstalled(pkg, depName) {
  return (
    pkg.dependencies?.[depName] ||
    pkg.devDependencies?.[depName]
  );
}

/**
 * Run npm install --package-lock-only
 */
function runNpmInstall(deps, isDev) {
  if (!deps.length) return;

  const args = [
    'install',
    '--package-lock-only',
    '--silent',
    ...deps,
    ...(isDev ? ['--save-dev'] : ['--save']),
  ];

  const result = spawnSync('npm', args, {
    cwd: process.cwd(),
    shell: true,
    stdio: 'ignore', // 👈 THIS hides all output
  });

  if (result.status !== 0) {
    console.error('❌ Failed to update dependencies');
    process.exit(1);
  }
}

/**
 * Pretty logging
 */
function logReport({ added, skipped }) {
  if (added.length) {
    console.log('✔ Added:\n');
    added.forEach((d) => {
      console.log(`  • ${d.name} → ${d.target}`);
    });
  }

  if (skipped.length) {
    console.log('\n[~] Skipped (already present):\n');
    skipped.forEach((d) => {
      console.log(`  • ${d.name}`);
    });
  }

  if (!added.length && !skipped.length) {
    console.log('No changes made.');
  }

  console.log('');
}

(async () => {
  const pkg = readPackageJson();

  const { selected } = await prompts({
    type: 'multiselect',
    name: 'selected',
    message: 'Select dependencies to add',
    choices: DEPS.map((dep) => ({
      title: `${dep.name}${dep.isDev ? ' [dev]' : ''}`,
      description: dep.description,
      value: dep,
    })),
  });

  if (!selected?.length) {
    console.log('\n[!] No dependencies selected. Exiting.');
    process.exit(0);
  }

  const report = {
    added: [],
    skipped: [],
  };

  const prodDeps = [];
  const devDeps = [];

  selected.forEach((dep) => {
    if (isAlreadyInstalled(pkg, dep.name)) {
      report.skipped.push({ name: dep.name });
      return;
    }

    if (dep.isDev) {
      devDeps.push(dep.name);
      report.added.push({ name: dep.name, target: 'devDependencies' });
    } else {
      prodDeps.push(dep.name);
      report.added.push({ name: dep.name, target: 'dependencies' });
    }
  });

  runNpmInstall(prodDeps, false);
  runNpmInstall(devDeps, true);

  logReport(report);
})();
