const {
  applyDetoxPatch,
  canApplyDetoxPatch,
  detoxAlreadyConfigured,
  setupDetoxRunner
} = require('./deps/detox');

module.exports = {
  async detox(quiet = false, dryRun = false) {
    try {
      if (detoxAlreadyConfigured()) {
        if (!quiet) console.warn('[i] Detox already configured. Skipping.');
        return { success: true, skipped: true, summary: "Detox already configured" };
      }

      const result = applyDetoxPatch(quiet, dryRun);

      if (!quiet) console.log('✅ Detox setup completed successfully.');
      return result;
    } catch (err) {
      if (!quiet) {
        console.error('\n[!] Detox setup failed. Installation will continue.');
        console.error('Reason:', err.message);
        console.error(
          'You can retry manually:\n' +
          'git apply scripts/patches/detox-setup.patch'
        );
      }
      return { success: false, error: err.message };
    }
  },

  'detox-runner'(quiet = false, dryRun = false) {
    try {
      return setupDetoxRunner(quiet, dryRun);
    } catch (err) {
      if (!quiet) console.error('[!] Detox Runner setup failed:', err.message);
      return { success: false, error: err.message };
    }
  },
};
