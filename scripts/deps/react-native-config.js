const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { format, spacing } = require('../utils/constants');
const { getPackageName, resolvePath } = require('../utils/project-helper');

const ROOT = process.cwd();

async function setupReactNativeConfig(quiet = false, dryRun = false) {
    const metaInfo = {
        success: true,
        summary: "Environment config (Android/iOS) setup completed",
        instructions: "You can now use `npm run env` or `npm run android:staging` scripts."
    };

    if (dryRun) {
        if (!quiet) console.log("Dry run: Skipping file writes for react-native-config");
        return metaInfo;
    }

    if (!quiet) console.log('\n🔧 Setting up react-native-config...');

    let anythingChanged = false;

    // 1. Android Setup
    // 1a. Patch build.gradle
    const gradlePath = resolvePath(ROOT, 'android/app/build.gradle');
    if (fs.existsSync(gradlePath)) {
        let content = fs.readFileSync(gradlePath, 'utf8');
        const applyLine = 'apply from: project(\':react-native-config\').projectDir.getPath() + "/dotenv.gradle"';
        const defaultConfigBlock = `
    // Dynamically set properties from env
    resValue "string", "build_config_package", "${getPackageName(ROOT)}"
    if (project.hasProperty("env")) {
        if (project.env.get("APP_DISPLAY_NAME")) {
            resValue "string", "app_name", project.env.get("APP_DISPLAY_NAME")
        }
        if (project.env.get("BUNDLE_ID_SUFFIX")) {
            applicationIdSuffix project.env.get("BUNDLE_ID_SUFFIX")
        }
    }
`;

        if (!content.includes('dotenv.gradle')) {
            // Insert after com.facebook.react
            if (content.includes('apply plugin: "com.facebook.react"')) {
                content = content.replace(
                    'apply plugin: "com.facebook.react"',
                    'apply plugin: "com.facebook.react"\n' + applyLine
                );
            } else {
                content = applyLine + '\n' + content;
            }
            anythingChanged = true;
            if (!quiet) console.log(`${spacing.s3}✔ Patched android/app/build.gradle (plugin)`);
        }

        if (!content.includes('build_config_package')) {
            // Inject into defaultConfig
            if (content.includes('defaultConfig {')) {
                content = content.replace(
                    'defaultConfig {',
                    'defaultConfig {' + defaultConfigBlock
                );
                anythingChanged = true;
                if (!quiet) console.log(`${spacing.s3}✔ Patched android/app/build.gradle (defaultConfig)`);
            }
        }

        if (anythingChanged) fs.writeFileSync(gradlePath, content);
    }

    // 1b. Patch proguard-rules.pro
    const proguardPath = resolvePath(ROOT, 'android/app/proguard-rules.pro');
    if (fs.existsSync(proguardPath)) {
        let content = fs.readFileSync(proguardPath, 'utf8');
        const pkg = getPackageName(ROOT);
        const keepLine = `-keep class ${pkg}.BuildConfig { *; }`;
        if (!content.includes('BuildConfig')) {
            const prefix = content.endsWith('\n') ? '' : '\n';
            fs.appendFileSync(proguardPath, `${prefix}${keepLine}\n`);
            anythingChanged = true;
            if (!quiet) console.log(`${spacing.s3}✔ Added Proguard rules`);
        }
    }

    // 2. Create .env files
    const envs = ['.env', '.env.staging', '.env.production'];
    envs.forEach(env => {
        const envPath = resolvePath(ROOT, env);
        if (!fs.existsSync(envPath)) {
            let envName = env.replace('.env', '').replace('.', '') || 'dev';
            let content = `ENV_NAME=${envName}\nAPI_URL=https://api.example.com/${envName}\n`;

            // Add native config placeholders
            content += `# Build Configs\n# APP_DISPLAY_NAME=My App (${envName})\n# BUNDLE_ID_SUFFIX=.${envName}\n`;

            fs.writeFileSync(envPath, content);
            anythingChanged = true;
            if (!quiet) console.log(`${spacing.s3}+ Created ${env}`);
        }
    });

    // 3. iOS Setup
    const xcconfigSource = path.join(__dirname, '../custom/ios/Config.xcconfig');
    const xcconfigDest = resolvePath(ROOT, 'ios/Config.xcconfig');

    // Ensure ios dir exists (it should in a standard project)
    if (fs.existsSync(resolvePath(ROOT, 'ios'))) {
        if (!fs.existsSync(xcconfigDest) && fs.existsSync(xcconfigSource)) {
            fs.copyFileSync(xcconfigSource, xcconfigDest);
            anythingChanged = true;
            if (!quiet) console.log(`${spacing.s3}+ Created ios/Config.xcconfig`);
        }
    }

    // 4. Update package.json scripts using npm pkg set
    const s = spacing.s3;
    try {
        // Run-env script registration
        spawnSync('npm', ['pkg', 'set', 'scripts.env=node scripts/run-env.js'], { stdio: 'ignore', cwd: ROOT });

        // Hijack ios/android ? The user requirements said:
        // "npm run ios should run npm run env"
        spawnSync('npm', ['pkg', 'set', 'scripts.ios=node scripts/run-env.js ios'], { stdio: 'ignore', cwd: ROOT });
        spawnSync('npm', ['pkg', 'set', 'scripts.android=node scripts/run-env.js android'], { stdio: 'ignore', cwd: ROOT });

        // Explicit scripts
        spawnSync('npm', ['pkg', 'set', 'scripts.android:staging=ENVFILE=.env.staging react-native run-android'], { stdio: 'ignore', cwd: ROOT });
        spawnSync('npm', ['pkg', 'set', 'scripts.android:prod=ENVFILE=.env.production react-native run-android'], { stdio: 'ignore', cwd: ROOT });
        spawnSync('npm', ['pkg', 'set', 'scripts.ios:staging=ENVFILE=.env.staging react-native run-ios'], { stdio: 'ignore', cwd: ROOT });
        spawnSync('npm', ['pkg', 'set', 'scripts.ios:prod=ENVFILE=.env.production react-native run-ios'], { stdio: 'ignore', cwd: ROOT });

        anythingChanged = true;
        if (!quiet) console.log(`${s}✔ Updated package.json scripts`);
    } catch (e) {
        if (!quiet) console.error(`${s}❌ Failed to update package.json scripts via npm pkg set`);
    }

    if (!anythingChanged) {
        metaInfo.summary = "Environment config checked (already up to date)";
    }

    if (!quiet) console.log('✅ react-native-config setup completed.');

    return metaInfo;
}

module.exports = {
    setupReactNativeConfig
};
