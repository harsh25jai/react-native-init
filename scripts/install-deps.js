#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const prompts = require('prompts');
const { spawn, spawnSync } = require('child_process');

const DEPS = require('./deps.config');
const SETUPS = require('./deps.setup');
const { stopSpinner, startSpinner, updateText } = require('./utils/spinner');
const { format, spacing } = require('./utils/constants');

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
 * Runs npm install --package-lock-only
 */
function runNpmInstall(deps, isDev) {
  if (!deps.length) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const args = [
      'install',
      '--package-lock-only',
      '--silent',
      ...deps,
      ...(isDev ? ['--save-dev'] : ['--save']),
    ];

    const child = spawn('npm', args, {
      cwd: process.cwd(),
      shell: true,
      stdio: 'ignore',
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('Failed to update dependencies via npm'));
      } else {
        resolve();
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Post-install hooks
 * @returns {Array<{name: string, summary: string, instructions: string}>}
 */
async function runPostInstallHooks(deps, quiet = false, dryRun = false) {
  const results = [];
  for (const dep of deps) {
    // if (dep.postInstall) {
    //   const commands = Array.isArray(dep.postInstall)
    //     ? dep.postInstall
    //     : [dep.postInstall];

    //   console.log('\n⚙ Running post-install steps:');
    //   commands.forEach((cmd) => {
    //     console.log(`  • ${cmd}`);
    //     spawnSync(cmd, { stdio: 'inherit', shell: true });
    //   });
    // }

    if (dep.setup && SETUPS[dep.setup]) {
      if (!quiet) console.log(`\n${spacing.s2}Running setup for ${dep.name}:`);
      const res = await SETUPS[dep.setup](quiet, dryRun);
      if (res && res.success) {
        results.push({
          name: dep.displayName || dep.name,
          summary: res.summary,
          instructions: res.instructions
        });
      }
    }
  }
  return results;
}

/**
 * Pretty logging
 */
function logReport({ added, skipped }) {
  if (added.length) {
    console.log(format.green('✔ Added:'));
    added.forEach((d) => {
      console.log(`${spacing.s2}• ${d.name} → ${d.target}`);
    });
  }

  if (skipped.length) {
    console.log('\n[~] Skipped (already present):');
    skipped.forEach((d) => {
      console.log(`${spacing.s2}• ${d.name}`);
    });
  }

  if (!added.length && !skipped.length) {
    console.log('No changes made.');
  }

  console.log('');
}

(async () => {
  try {
    const pkg = readPackageJson();
    const isDryRun = process.argv.includes('--dry-run');

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

    // Contextual Selection: Detox Helper Runner
    const detoxDep = selected.find(d => d.setup === 'detox');
    if (detoxDep) {
      const { useRunner } = await prompts({
        type: 'confirm',
        name: 'useRunner',
        message: `${spacing.s3}└─ Add Detox Helper Runner (interactive CLI)?`,
        initial: true
      });

      if (useRunner) {
        // Manually inject the runner config
        selected.push({
          name: 'prompts',
          displayName: 'detox-runner',
          isDev: true,
          category: 'testing',
          description: 'Detox Helper Runner (Interactive CLI)',
          setup: 'detox-runner'
        });
      }
    }

    // Contextual Selection: React Native Config (CLI dependency)
    const rnConfigDep = selected.find(d => d.name === 'react-native-config');
    if (rnConfigDep) {
      // ensure prompts is present for run-env.js
      if (!selected.find(d => d.name === 'prompts')) {
        selected.push({
          name: 'prompts',
          isDev: true,
          description: 'Required for interactive environment scripts',
        });
      }
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

      // Append version only if provided
      const depWithVersion = dep.version ? `${dep.name}@${dep.version}` : dep.name;

      if (dep.isDev) {
        devDeps.push(depWithVersion);
        report.added.push({ name: depWithVersion, target: 'devDependencies' });
      } else {
        prodDeps.push(depWithVersion);
        report.added.push({ name: depWithVersion, target: 'dependencies' });
      }
    });

    const setupResults = [];
    const quiet = true;

    if (isDryRun) {
      console.info(`\n Dry run enabled — simulating installation experience...\n`);
    } else {
      console.log('')
    }

    startSpinner(`${spacing.s2}Preparing installation...`);

    // Helper for simulation delays
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      // 1. Prod Dependencies
      if (prodDeps.length) {
        updateText(`${spacing.s2}Updating dependencies...`);
        if (isDryRun) {
          await sleep(1000);
        } else {
          await runNpmInstall(prodDeps, false);
        }
      }

      // 2. Dev Dependencies
      if (devDeps.length) {
        updateText(`${spacing.s2}Updating devDependencies...`);
        if (isDryRun) {
          await sleep(1000);
        } else {
          await runNpmInstall(devDeps, true);
        }
      }

      // 3. Post-install hooks
      updateText(`${spacing.s2}Running post-install setup hooks...`);
      if (isDryRun) {
        await sleep(800);
      }
      stopSpinner();

      const results = await runPostInstallHooks(selected, quiet, isDryRun);
      setupResults.push(...results);

      // Final "Great Reveal" (Always show if something was done/selected)
      console.log(`\n${spacing.s2}Installation complete!\n`);

      if (setupResults.length > 0) {
        console.log(format.magenta(`${spacing.s2}Summary`) + (isDryRun ? ' (simulated):' : ':'));
        setupResults.forEach(res => {
          console.log(`${spacing.s2}${format.green('✔')} ${format.bold(res.name)}: ${res.summary}`);
        });

        console.info(format.magenta(`\n${spacing.s2}Instructions:`));
        setupResults.forEach(res => {
          if (res.instructions) {
            // If instructions are multiline (contain newlines), print on new line
            if (res.instructions.includes('\n')) {
              console.log(`\n ${res.instructions}`);
            } else {
              console.log(`${spacing.s3}${format.bold(res.name)}: ${res.instructions}`);
            }
          }
        });
        console.log('');
      }

      if (isDryRun) {
        console.warn('[!] Dry run finished. No permanent changes were made to the project.\n');
      }

    } catch (error) {
      stopSpinner();
      console.error('\n❌ Error during installation phase:', error.message || error);
      process.exit(1);
    }

    logReport(report);
  } catch (error) {
    stopSpinner();
    console.error('\n❌ Error during setup:', error.message || error);
    process.exit(1);
  }
})();
