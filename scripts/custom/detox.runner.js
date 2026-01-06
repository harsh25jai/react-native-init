#!/usr/bin/env node
const { spawn } = require('child_process');
const prompts = require('prompts');

const { handleCommandHistory } = require('./script.history');

/**
 * Configuration for Detox Runner
 */
const CONFIG = {
  IOS: {
    build: ['ios.sim.debug', 'ios.sim.release'],
    test: ['ios.sim.debug', 'ios.sim.release'],
  },
  ANDROID: {
    build: ['android.emu.debug', 'android.emu.release'],
    test: ['android.emu.debug', 'android.emu.release'],
  },
};

/**
 * Detox Runner CLI Script
 *
 * A command-line utility to help run Detox build/test workflows for React Native apps
 * with support for command history and Metro bundler bootstrapping.
 *
 * Features:
 * - Interactive prompts to select platform (iOS/Android), task type (build/test/clean), and configuration
 * - Avoids polluting `package.json` with dozens of Detox script commands
 * - Saves previously used commands for reuse
 * - Recommends the most used or last used commands
 * - Boots Metro bundler in the background if needed
 * - Supports additional arguments passed via CLI
 *
 * Usage:
 * ```bash
 * npm run detox:run
 * ```
 *
 * ```bash
 * npm run detox:run -- --record-logs all
 * ```
 *
 * Usage:
 *    npm run detox:run -- --platform ios --type test --config ios.sim.debug
 *    npm run detox:run -- --platform android --type test --config android.emu.debug
 *
 * Internally uses:
 * - `.detox_history.json` to maintain command history
 */

(async () => {
  // Parse arguments
  const rawArgs = process.argv.slice(2);
  const options = {
    platform: null,
    type: null,
    config: null,
    ci: process.env.CI === 'true',
    dryRun: false,
    extraArgs: [],
  };

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg === '--platform') {
      options.platform = rawArgs[++i]?.toLowerCase();
    } else if (arg === '--type') {
      options.type = rawArgs[++i]?.toLowerCase();
    } else if (arg === '--config') {
      options.config = rawArgs[++i];
    } else if (arg === '--ci') {
      options.ci = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else {
      options.extraArgs.push(arg);
    }
  }

  // 1. History Check (Interactive Only)
  // If no specific args provided and not in CI, check history
  if (!options.ci && !options.platform && !options.type && !options.config) {
    const { recentCommand, saveToHistory } = await handleCommandHistory('detox');
    if (recentCommand) {
      saveToHistory(recentCommand);
      const metroProcess = startMetroBundler(options.dryRun);
      await runCommand(recentCommand, metroProcess, options.dryRun);
      return;
    }
  }

  // 2. Platform Selection
  if (!options.platform) {
    if (options.ci) {
      console.error('❌ CI mode requires --platform argument.');
      process.exit(1);
    }
    const response = await prompts({
      type: 'select',
      name: 'platform',
      message: 'Select platform',
      choices: [
        { title: 'iOS', value: 'ios' },
        { title: 'Android', value: 'android' },
      ],
    });
    options.platform = response.platform;
  }

  if (!options.platform) {
    console.warn('⚠️ No platform selected. Exiting...');
    process.exit(1);
  }

  // 3. Task Type Selection
  if (!options.type) {
    if (options.ci) {
      console.error('❌ CI mode requires --type argument.');
      process.exit(1);
    }

    const typeChoices = [
      { title: 'Build', value: 'build' },
      { title: 'Test', value: 'test' },
    ];
    if (options.platform === 'ios') {
      typeChoices.push({ title: 'Clean Detox Cache', value: 'clean' });
    }

    const response = await prompts({
      type: 'select',
      name: 'type',
      message: 'Select task type',
      choices: typeChoices,
    });
    options.type = response.type;
  }

  if (!options.type) {
    console.warn('⚠️ No task type selected. Exiting...');
    process.exit(1);
  }

  // Special Case: Clean (iOS only)
  if (options.type === 'clean') {
    const cleanCommand = 'detox clean-framework-cache && detox build-framework-cache';
    await runCommand(cleanCommand, null, options.dryRun);
    return;
  }

  // 4. Configuration Selection
  if (!options.config) {
    if (options.ci) {
      console.error('❌ CI mode requires --config argument.');
      process.exit(1);
    }

    const platformConfigs = CONFIG[options.platform.toUpperCase()];
    const availableConfigs = platformConfigs?.[options.type] || [];

    if (availableConfigs.length === 0) {
      console.error(`❌ No configurations found for ${options.platform} ${options.type}`);
      process.exit(1);
    }

    const response = await prompts({
      type: 'select',
      name: 'config',
      message: 'Select configuration',
      choices: availableConfigs.map((c) => ({ title: c, value: c })),
    });
    options.config = response.config;
  }

  if (!options.config) {
    console.warn('⚠️ No configuration selected. Exiting...');
    process.exit(1);
  }

  // 5. Execution
  const metroProcess = startMetroBundler(options.dryRun);

  // Construct the base detox command
  const detoxCmd = `detox ${options.type} -c ${options.config} ${options.extraArgs.join(' ')}`;

  // Save to history (if not CI)
  if (!options.ci && !options.dryRun) {
    // We need logic to save, but script.history.js is designed for interactive usage.
    // We'll manually require and save if needed, or rely on the earlier handleCommandHistory call.
    // For now, we only save if we went through the interactive flow or if we want to save this constructed command.
    const { saveToHistory } = await handleCommandHistory('detox');
    saveToHistory(detoxCmd);
  }

  await runCommand(detoxCmd, metroProcess, options.dryRun);
})();

function startMetroBundler(dryRun) {
  if (dryRun) {
    console.info('[Dry Run] Would start Metro Bundler in background...');
    return null;
  }
  console.info('📦 Starting Metro Bundler in background...');
  const metro = spawn('npx', ['react-native', 'start'], {
    stdio: 'ignore',
    shell: true,
  });

  metro.on('error', (err) => {
    console.error('Failed to start Metro process:', err);
    process.exit(1);
  });

  return metro;
}

function runCommand(command, metroProcess, dryRun) {
  if (dryRun) {
    console.info(`[Dry Run] Would run: ${command}`);
    if (metroProcess) {
      console.info('[Dry Run] Would stop Metro Bundler...');
    }
    return Promise.resolve();
  }

  console.info(`\nRunning: ${command}\n`);
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      stdio: 'inherit',
      shell: true,
    });

    child.on('error', (err) => {
      console.error('Failed to start process:', err);
      if (metroProcess) metroProcess.kill();
      process.exit(1);
    });

    child.on('exit', (code) => {
      console.info(`\nProcess exited with code ${code}`);
      if (metroProcess) {
        console.info('📦 Stopping Metro Bundler...');
        metroProcess.kill();
      }
      if (code !== 0) {
        process.exit(code);
      } else {
        resolve();
      }
    });
  });
}
