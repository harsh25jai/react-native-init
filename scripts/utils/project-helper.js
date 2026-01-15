const fs = require('fs');
const path = require('path');

/**
 * Resolve absolute path from root
 * @param {string} root 
 * @param {string} relPath 
 * @returns {string}
 */
function resolvePath(root, relPath) {
    return path.join(root, relPath);
}

/**
 * Robust Android package name detection
 * @param {string} root - Project root directory
 * @returns {string}
 */
function getPackageName(root = process.cwd()) {
    const manifestPath = resolvePath(root, 'android/app/src/main/AndroidManifest.xml');
    if (fs.existsSync(manifestPath)) {
        const manifest = fs.readFileSync(manifestPath, 'utf8');
        const m = manifest.match(/package="([^"]+)"/);
        if (m && m[1]) return m[1];
    }

    const gradlePath = resolvePath(root, 'android/app/build.gradle');
    if (fs.existsSync(gradlePath)) {
        const gradle = fs.readFileSync(gradlePath, 'utf8');
        const m = gradle.match(/namespace\s+['"]([^'"]+)['"]/);
        if (m && m[1]) return m[1];
        const appIdMatch = gradle.match(/applicationId\s+['"]([^'"]+)['"]/);
        if (appIdMatch && appIdMatch[1]) return appIdMatch[1];
    }

    return 'com.reactnativeinit';
}

/**
 * Detect App Name from app.json
 * @param {string} root - Project root directory
 * @returns {string}
 */
function getAppName(root = process.cwd()) {
    const appJsonPath = resolvePath(root, 'app.json');
    if (fs.existsSync(appJsonPath)) {
        try {
            const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
            if (appJson.name) return appJson.name;
        } catch (e) { }
    }
    return 'reactNativeInit';
}

module.exports = {
    resolvePath,
    getPackageName,
    getAppName
};
