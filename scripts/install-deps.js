#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const prompts = require('prompts');

const DEPS = require('./deps.config');

const pkgPath = path.join(process.cwd(), 'package.json');

/**
 * Apply selected dependencies to package.json without overriding existing ones
 */
function applyDependencies(pkg, selectedDeps) {
  pkg.dependencies ??= {};
  pkg.devDependencies ??= {};

  const report = {
    added: [],
    skipped: [],
  };

  selectedDeps.forEach((dep) => {
    const { name, version = 'latest', isDev } = dep;

    if (pkg.dependencies[name] || pkg.devDependencies[name]) {
      report.skipped.push({
        name,
        version: pkg.dependencies[name] || pkg.devDependencies[name],
        existingIn: pkg.dependencies[name] ? 'dependencies' : 'devDependencies',
      });
      return;
    }

    const target = isDev ? 'devDependencies' : 'dependencies';
    pkg[target][name] = version;

    report.added.push({
      name,
      version,
      target,
    });
  });

  return report;
}

/**
 * Pretty log what changed
 */
function logDependencyReport(report) {
  console.log('\nDependency update summary:\n');

  if (report.added.length) {
    console.log('✔ Added:\n');
    report.added.forEach(({ name, version, target }) => {
      console.log(`  • ${name}@${version}  → ${target}`);
    });
    console.log('');
  }

  if (report.skipped.length) {
    console.log('[~] Skipped (already present):\n');
    report.skipped.forEach(({ name, version, existingIn }) => {
      console.log(`  • ${name}@${version} (in ${existingIn})`);
    });
    console.log('');
  }

  if (!report.added.length && !report.skipped.length) {
    console.log('[!] No dependency changes were required.\n');
  }
}

(async () => {
  if (!fs.existsSync(pkgPath)) {
    console.error('package.json not found');
    process.exit(1);
  }

  const { selected } = await prompts({
    type: 'multiselect',
    name: 'selected',
    message: 'Select dependencies to add',
    choices: DEPS.map((dep) => ({
      title: `${dep.name}${dep.isDev ? ' (dev)' : ''}`,
      description: dep.description,
      value: dep,
    })),
  });

  if (!selected || selected.length === 0) {
    console.log('[!] No dependencies selected. Exiting.');
    process.exit(0);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  const report = applyDependencies(pkg, selected);

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  logDependencyReport(report);
})();
