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
      // if (!isGitRepo()) {
      //   console.warn('[!] Git repository not found. Skipping Detox setup.');
      //   return;
      // }

      // if (!isGitClean()) {
      //   console.log('[!] Git working tree is not clean.');
      //   console.log('    Please commit or stash changes and re-run install.');
      //   return;
      // }

      if (detoxAlreadyConfigured()) {
        console.warn('[i] Detox already configured. Skipping.');
        return;
      }

      if (!canApplyDetoxPatch()) {
        console.warn('[!] Detox patch is not compatible with this template version.');
        return;
      }

      applyDetoxPatch();

      console.log('✅ Detox setup completed successfully.');
    } catch (err) {
      console.error('\n[!] Detox setup failed. Installation will continue.');
      console.error('Reason:', err.message);
      console.error(
        'You can retry manually:\n' +
        'git apply scripts/patches/detox-setup.patch'
      );
    }
  },
};
