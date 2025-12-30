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
  const patchPath = path.join(
    __dirname,
    '..',
    'patches',
    'detox-setup.patch'
  );

  if (!fs.existsSync(patchPath)) {
    throw new Error('Detox patch not found');
  }

  const res = run('git', [
    'apply',
    '--whitespace=nowarn',
    patchPath,
  ], { stdio: 'inherit' });

  if (res && res.status === 0) {
    return;
  }

  console.warn('[i] git apply failed, falling back to scripted Detox setup.');

  // Fallback: apply changes via a script that edits files idempotently
  try {
    const fallback = require('./detox-fallback');
    const result = fallback.applyFallback(process.cwd());
    console.log('✅ Detox fallback applied. Files created:', result.created.length, 'modified:', result.changed.length);
    result.created.forEach(f => console.log('  +', f));
    result.changed.forEach(f => console.log('  ~', f));
  } catch (err) {
    throw new Error('Failed to apply Detox patch (git apply failed and fallback failed): ' + err.message);
  }
}

module.exports = {
    applyDetoxPatch,
    canApplyDetoxPatch,
    detoxAlreadyConfigured,
    isGitClean,
    isGitRepo,
}