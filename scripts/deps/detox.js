const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { format, spacing } = require('../utils/constants');

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    stdio: 'pipe',
    encoding: 'utf8',
    ...opts,
  });
}

function isGitRepo() {
  return run('git', ['rev-parse', '--is-inside-work-tree']).status === 0;
}

function isGitClean() {
  const res = run('git', ['status', '--porcelain']);
  return res.status === 0 && res.stdout.trim().length === 0;
}

function detoxAlreadyConfigured() {
  return fs.existsSync(path.join(process.cwd(), 'e2e'));
}

function canApplyDetoxPatch() {
  // Now that we have a modular JS setup, we can always attempt it.
  // The actual check happens inside applyDetoxPatch via the codemod engine.
  const codemodPath = path.join(__dirname, '..', 'codemods', 'detox-setup.js');
  return fs.existsSync(codemodPath);
}

/**
 * Apply the Detox template patch.
 * @param {boolean} quiet - If true, suppresses most console output.
 * @param {boolean} dryRun - If true, only returns metaInfo without making changes.
 */
function applyDetoxPatch(quiet = false, dryRun = false) {
  const metaInfo = {
    success: true,
    summary: "Environment setup for Detox (Android/iOS) done.",
    instructions: "See https://wix.github.io/Detox/docs/introduction/getting-started/ for the latest up-to-date instructions."
  };

  if (dryRun) return metaInfo;

  try {
    const codemodPath = path.join(__dirname, '..', 'codemods', 'detox-setup.js');
    const res = spawnSync('node', [codemodPath], {
      stdio: quiet ? 'ignore' : 'inherit',
      cwd: process.cwd(),
    });

    if (res.status !== 0) {
      throw new Error(`Detox setup engine failed with code ${res.status}`);
    }

    return metaInfo;
  } catch (err) {
    throw new Error('Detox setup failed: ' + err.message);
  }
}

/**
 * Setup handler for Detox Runner
 */
function setupDetoxRunner(quiet = false, dryRun = false) {
  const metaInfo = {
    success: true,
    summary: "Added Detox Helper Runner (interactive CLI)",
    instructions: `${spacing.s2}${format.bold('Run instructions for Detox:')} \n${spacing.s3}• npm run detox:run`
  };

  if (dryRun) return metaInfo;

  const root = process.cwd();
  const scriptsDir = path.join(root, 'scripts');
  const pkgPath = path.join(root, 'package.json');

  if (!quiet) console.log('🧪 Setting up Detox Helper Runner...');

  // 1. Ensure scripts directory exists
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }

  // 2. Copy runner scripts from templates
  const sourceDir = path.join(__dirname, '..', 'custom');
  const filesToCopy = ['detox.runner.js', 'script.history.js'];

  filesToCopy.forEach(file => {
    const src = path.join(sourceDir, file);
    const dest = path.join(scriptsDir, file);

    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      if (!quiet) console.log(`${spacing.s3}+ Created scripts/${file}`);
    } else if (!quiet) {
      console.warn(`${spacing.s3}[!] Source script not found: ${src}`);
    }
  });

  // 3. Update package.json scripts using npm pkg set
  try {
    spawnSync('npm', ['pkg', 'set', 'scripts.detox:run=node scripts/detox.runner.js'], { stdio: 'ignore', cwd: root });
    if (!quiet) console.log(`${spacing.s3}~ Configured "detox:run" in package.json`);
  } catch (e) {
    if (!quiet) console.warn(`${spacing.s3}[!] Failed to set detox:run script via npm pkg set. Falling back to manual check...`);
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      pkg.scripts = pkg.scripts || {};
      if (!pkg.scripts['detox:run']) {
        pkg.scripts['detox:run'] = 'node scripts/detox.runner.js';
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      }
    }
  }

  if (!quiet) console.log('✅ Detox Helper Runner setup completed.');

  return metaInfo;
}

module.exports = {
  applyDetoxPatch,
  canApplyDetoxPatch,
  detoxAlreadyConfigured,
  isGitClean,
  isGitRepo,
  setupDetoxRunner
}