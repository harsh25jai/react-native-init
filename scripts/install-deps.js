#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const prompts = require('prompts');
const { spawnSync } = require('child_process');

const DEPS = require('./deps.config');
const SETUPS = require('./deps.setup');
const { stopSpinner, startSpinner, updateText } = require('./utils/spinner');

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
      if (!quiet) console.log(`\n⚙ Running setup for ${dep.name}:`);
      const res = await SETUPS[dep.setup](quiet, dryRun);
      if (res && res.success) {
        results.push({
          name: dep.name,
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
        message: '   └─ Add Detox Helper Runner (interactive CLI)?',
        initial: true
      });

      if (useRunner) {
        // Manually inject the runner config
        selected.push({
          name: 'prompts',
          isDev: true,
          category: 'testing',
          description: 'Detox Helper Runner (Interactive CLI)',
          setup: 'detox-runner'
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
      console.log('\n🔍 Dry run enabled — simulating installation experience...\n');
    } else {
      console.log('');
    }

    startSpinner('🏗️ Preparing installation...');

    // Helper for simulation delays
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      // 1. Prod Dependencies
      if (prodDeps.length) {
        updateText('⛓️‍💥 Updating dependencies...');
        if (isDryRun) {
          await sleep(1000);
        } else {
          runNpmInstall(prodDeps, false);
        }
      }

      // 2. Dev Dependencies
      if (devDeps.length) {
        updateText('  Updating devDependencies...');
        if (isDryRun) {
          await sleep(1000);
        } else {
          runNpmInstall(devDeps, true);
        }
      }

      // 3. Post-install hooks
      updateText('  Running post-install setup hooks...');
      if (isDryRun) {
        await sleep(800);
      }
      const results = await runPostInstallHooks(selected, quiet, isDryRun);
      setupResults.push(...results);

      stopSpinner();

      // Final "Great Reveal" (Always show if something was done/selected)
      console.log('\n  Installation complete!\n');

      if (setupResults.length > 0) {
        console.log('📝 Summary of things done' + (isDryRun ? ' (simulated):' : ':'));
        setupResults.forEach(res => {
          console.log(`  ✅ ${res.summary} (${res.name})`);
        });

        console.log('\n  Instructions :');
        setupResults.forEach(res => {
          if (res.instructions) {
            console.log(`  👉 ${res.name}: ${res.instructions}`);
          }
        });
        console.log('');
      }

      if (isDryRun) {
        console.log('[!] Dry run finished. No permanent changes were made to the project.\n');
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
