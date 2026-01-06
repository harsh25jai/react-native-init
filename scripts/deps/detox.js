const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function applyDetoxPatch() {
  try {
    const codemodPath = path.join(__dirname, '..', 'codemods', 'detox-setup.js');
    const res = spawnSync('node', [codemodPath], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    if (res.status !== 0) {
      throw new Error(`Detox setup engine failed with code ${res.status}`);
    }
  } catch (err) {
    throw new Error('Detox setup failed: ' + err.message);
  }
}

/**
 * Setup handler for Detox Runner
 */
function setupDetoxRunner() {
  const root = process.cwd();
  const scriptsDir = path.join(root, 'scripts');
  const pkgPath = path.join(root, 'package.json');

  console.log('🧪 Setting up Detox Helper Runner...');

  // 1. Ensure scripts directory exists
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }

  // 2. Copy runner scripts from templates
  // Note: These originate from the developer project's scripts/custom directory
  const sourceDir = path.join(__dirname, '..', 'custom');
  const filesToCopy = ['detox.runner.js', 'script.history.js'];

  filesToCopy.forEach(file => {
    const src = path.join(sourceDir, file);
    const dest = path.join(scriptsDir, file);

    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`   + Created scripts/${file}`);
    } else {
      console.warn(`   [!] Source script not found: ${src}`);
    }
  });

  // 3. Update package.json scripts using npm pkg set
  try {
    spawnSync('npm', ['pkg', 'set', 'scripts.detox:run=node scripts/detox.runner.js'], { stdio: 'ignore', cwd: root });
    console.log('   ~ Configured "detox:run" in package.json');
  } catch (e) {
    console.warn('   [!] Failed to set detox:run script via npm pkg set. Falling back to manual check...');
    // Manual fallback if needed (though npm pkg set is standard now)
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      pkg.scripts = pkg.scripts || {};
      if (!pkg.scripts['detox:run']) {
        pkg.scripts['detox:run'] = 'node scripts/detox.runner.js';
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      }
    }
  }

  // 4. Ensure 'prompts' is in devDependencies
  // Since this is run during install-deps.js, we can potentially add it to the pending install list
  // However, the setup handlers are run AFTER npm install usually (or as part of it).
  // Let's check if we need to manually add it or if the user handles it.
  // Fixed: install-deps.js handles adding the dependency to the list before install if we configure it correctly in deps.config.js
  console.log('✅ Detox Helper Runner setup completed.');
}

module.exports = {
  applyDetoxPatch,
  canApplyDetoxPatch,
  detoxAlreadyConfigured,
  isGitClean,
  isGitRepo,
  setupDetoxRunner
}