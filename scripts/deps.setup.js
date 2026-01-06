const {
  applyDetoxPatch,
  canApplyDetoxPatch,
  detoxAlreadyConfigured,
  setupDetoxRunner
} = require('./deps/detox');
const prompts = require('prompts');

module.exports = {
  async detox() {
    try {
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
