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
  const patchPath = path.join(__dirname, '..', 'patches', 'detox-setup.patch');

  if (!fs.existsSync(patchPath)) {
    console.warn('[!] Detox patch not found at', patchPath);
    return false;
  }

  const res = run('git', ['apply', '--check', '--verbose', patchPath]);

  if (res && res.status !== 0) {
    console.warn('Res status:', res.status, res.stdout || res.stderr || res);
  }

  return res && res.status === 0;
}

function applyDetoxPatch() {
  console.log('🧪 Applying Detox modular setup...');

  try {
    const codemodPath = path.join(__dirname, '..', 'codemods', 'detox-setup.js');
    const res = spawnSync('node', [codemodPath], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    if (res.status === 0) {
      console.log('✅ Detox modular setup completed successfully.');
      return;
    }

    throw new Error(`Codemod exited with code ${res.status}`);
  } catch (err) {
    console.warn('[!] Modular setup failed, trying git apply as secondary fallback.');

    // Legacy fallback to patch file if JS setup fails
    const patchPath = path.join(__dirname, '..', 'patches', 'detox-setup.patch');
    if (fs.existsSync(patchPath)) {
      const res = run('git', ['apply', '--whitespace=nowarn', patchPath], { stdio: 'inherit' });
      if (res && res.status === 0) {
        console.log('✅ Detox setup completed via git apply.');
        return;
      }
    }

    throw new Error('All Detox setup methods failed: ' + err.message);
  }
}

module.exports = {
  applyDetoxPatch,
  canApplyDetoxPatch,
  detoxAlreadyConfigured,
  isGitClean,
  isGitRepo,
}