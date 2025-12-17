const {
  applyDetoxPatch,
  canApplyDetoxPatch,
  detoxAlreadyConfigured,
  isGitRepo,
  isGitClean,
} = require('./deps/detox');

module.exports = {
  detox() {
    console.log('\n🧪 Setting up Detox (mandatory)');

    try {
      if (!isGitRepo()) {
        console.log('[!] Git repository not found. Skipping Detox setup.');
        return;
      }

      if (!isGitClean()) {
        console.log('[!] Git working tree is not clean.');
        console.log('    Please commit or stash changes and re-run install.');
        return;
      }

      if (detoxAlreadyConfigured()) {
        console.log('[i] Detox already configured. Skipping.');
        return;
      }

      if (!canApplyDetoxPatch()) {
        console.log('[!] Detox patch is not compatible with this template version.');
        return;
      }

      applyDetoxPatch();

      console.log('✅ Detox setup completed successfully.');
    } catch (err) {
      console.log('\n[!] Detox setup failed. Installation will continue.');
      console.log('Reason:', err.message);
      console.log(
        'You can retry manually:\n' +
        'git apply scripts/patches/detox-setup.patch'
      );
    }
  },
};
