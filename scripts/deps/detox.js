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

  if (res.status !== 0) {
    throw new Error('Failed to apply Detox patch');
  }
}

module.exports = {
    applyDetoxPatch,
    canApplyDetoxPatch,
    detoxAlreadyConfigured,
    isGitClean,
    isGitRepo,
}