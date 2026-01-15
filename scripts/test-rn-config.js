const { setupReactNativeConfig } = require('./deps/react-native-config');

(async () => {
    console.log('🧪 Verifying react-native-config setup (Dry Run)...');
    try {
        const result = await setupReactNativeConfig(false, true);
        console.log('\n--- Result ---');
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error(e);
    }
})();
