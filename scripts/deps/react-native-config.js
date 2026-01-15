const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const prompts = require('prompts');
const { format, spacing } = require('../utils/constants');
const { getPackageName, resolvePath } = require('../utils/project-helper');

const ROOT = process.cwd();

async function setupReactNativeConfig(quiet = false, dryRun = false) {
    const metaInfo = {
        success: true,
        summary: "Environment config setup completed",
        instructions: ""
    };

    if (!quiet) console.log('\n🔧 Setting up react-native-config...');

    // --- 1. OPT-IN WIZARD ---
    const response = await prompts({
        type: 'confirm',
        name: 'configure',
        message: 'Do you want to configure advanced environment features? (App Name, Bundle ID, etc.)',
        initial: true
    });

    if (!response.configure) {
        if (!quiet) console.log(`${spacing.s2}ℹ Skipping advanced configuration.`);
        return { success: true, summary: "Installed react-native-config (Basic Mode)", instructions: "Manual configuration required for advanced features." };
    }

    // --- 2. CONFIGURATION WIZARD ---
    const config = await prompts([
        {
            type: 'multiselect',
            name: 'features',
            message: 'Which native features do you want to control via .env?',
            choices: [
                { title: 'App Display Name', value: 'displayName', description: 'Change App Name per env', selected: true },
                { title: 'Bundle ID Suffix', value: 'bundleId', description: 'Append .staging, .dev etc.', selected: true },
                { title: 'Versioning', value: 'version', description: 'Control Version Code/Name', selected: false },
                { title: 'API URL', value: 'apiUrl', description: 'Standard API URL usage', selected: true }
            ],
            min: 1
        },
        {
            type: 'multiselect',
            name: 'environments',
            message: 'Which environments do you need?',
            choices: [
                { title: 'Dev (.env)', value: 'dev', selected: true },
                { title: 'Staging (.env.staging)', value: 'staging', selected: true },
                { title: 'Production (.env.production)', value: 'prod', selected: true }
            ],
            min: 1
        },
        {
            type: 'multiselect',
            name: 'scripts',
            message: 'How would you like to run these environments?',
            choices: [
                { title: 'Interactive CLI (npm run env)', value: 'cli', selected: true, description: 'hijacks npm run ios/android' },
                { title: 'Explicit Scripts', value: 'explicit', selected: true, description: 'npm run android:staging etc.' }
            ]
        }
    ]);

    if (!config.features || !config.environments) {
        return { success: false, error: "Setup cancelled by user" };
    }

    let anythingChanged = false;
    const hasFeature = (f) => config.features.includes(f);
    const hasEnv = (e) => config.environments.includes(e);

    // --- 3. IMPLEMENTATION ---

    // 1. Android Setup (build.gradle)
    const gradlePath = resolvePath(ROOT, 'android/app/build.gradle');
    if (fs.existsSync(gradlePath)) {
        let content = fs.readFileSync(gradlePath, 'utf8');
        const applyLine = 'apply from: project(\':react-native-config\').projectDir.getPath() + "/dotenv.gradle"';

        let defaultConfigBody = `    // Dynamically set properties from env\n    resValue "string", "build_config_package", "${getPackageName(ROOT)}"\n`;

        if (hasFeature('displayName') || hasFeature('bundleId')) {
            defaultConfigBody += `    if (project.hasProperty("env")) {\n`;
            if (hasFeature('displayName')) {
                defaultConfigBody += `        if (project.env.get("APP_DISPLAY_NAME")) {\n            resValue "string", "app_name", project.env.get("APP_DISPLAY_NAME")\n        }\n`;
            }
            if (hasFeature('bundleId')) {
                defaultConfigBody += `        if (project.env.get("BUNDLE_ID_SUFFIX")) {\n            applicationIdSuffix project.env.get("BUNDLE_ID_SUFFIX")\n        }\n`;
            }
            defaultConfigBody += `    }\n`;
        }

        // Apply Plugin
        if (!content.includes('dotenv.gradle')) {
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

        // Inject Config
        if (!content.includes('build_config_package') && (hasFeature('displayName') || hasFeature('bundleId'))) {
            if (content.includes('defaultConfig {')) {
                content = content.replace(
                    'defaultConfig {',
                    'defaultConfig {\n' + defaultConfigBody
                );
                anythingChanged = true;
                if (!quiet) console.log(`${spacing.s3}✔ Patched android/app/build.gradle (defaultConfig)`);
            }
        }

        if (anythingChanged) {
            if (!dryRun) fs.writeFileSync(gradlePath, content);
        }
    }

    // 1b. Proguard Rules (Always needed for robustness if using config)
    const proguardPath = resolvePath(ROOT, 'android/app/proguard-rules.pro');
    if (fs.existsSync(proguardPath)) {
        let content = fs.readFileSync(proguardPath, 'utf8');
        const pkg = getPackageName(ROOT);
        const keepLine = `-keep class ${pkg}.BuildConfig { *; }`;
        if (!content.includes('BuildConfig')) {
            const prefix = content.endsWith('\n') ? '' : '\n';
            if (!dryRun) fs.appendFileSync(proguardPath, `${prefix}${keepLine}\n`);
            anythingChanged = true;
            if (!quiet) console.log(`${spacing.s3}✔ Added Proguard rules`);
        }
    }

    // 2. Create .env files
    const envMap = {
        'dev': '.env',
        'staging': '.env.staging',
        'prod': '.env.production'
    };

    config.environments.forEach(envKey => {
        const fileName = envMap[envKey];
        if (!fileName) return;

        const envPath = resolvePath(ROOT, fileName);
        if (!fs.existsSync(envPath)) {
            let envName = envKey;
            let content = `ENV_NAME=${envName}\n`;
            if (hasFeature('apiUrl')) content += `API_URL=https://api.example.com/${envName}\n`;

            content += `\n# Build Configs\n`;
            if (hasFeature('displayName')) content += `APP_DISPLAY_NAME=My App (${envName})\n`;
            if (hasFeature('bundleId') && envKey !== 'prod') content += `BUNDLE_ID_SUFFIX=.${envName}\n`;
            if (hasFeature('version')) content += `VERSION_CODE=1\nVERSION_NAME=1.0.0\n`;

            if (!dryRun) fs.writeFileSync(envPath, content);
            anythingChanged = true;
            if (!quiet) console.log(`${spacing.s3}+ Created ${fileName}`);
        }
    });

    // 3. iOS Setup (Config.xcconfig)
    // Always copy this if features are selected, as it's harmless if unused but helpful if needed
    const xcconfigSource = path.join(__dirname, '../custom/ios/Config.xcconfig');
    const xcconfigDest = resolvePath(ROOT, 'ios/Config.xcconfig');
    if (fs.existsSync(resolvePath(ROOT, 'ios'))) {
        if (!fs.existsSync(xcconfigDest) && fs.existsSync(xcconfigSource)) {
            if (!dryRun) fs.copyFileSync(xcconfigSource, xcconfigDest);
            anythingChanged = true;
            if (!quiet) console.log(`${spacing.s3}+ Created ios/Config.xcconfig`);
        }
    }

    // 4. Update Scripts
    const s = spacing.s3;
    const hasCli = config.scripts.includes('cli');
    const hasExplicit = config.scripts.includes('explicit');

    try {
        if (hasCli) {
            if (!dryRun) {
                spawnSync('npm', ['pkg', 'set', 'scripts.env=node scripts/run-env.js'], { stdio: 'ignore', cwd: ROOT });
                spawnSync('npm', ['pkg', 'set', 'scripts.ios=node scripts/run-env.js ios'], { stdio: 'ignore', cwd: ROOT });
                spawnSync('npm', ['pkg', 'set', 'scripts.android=node scripts/run-env.js android'], { stdio: 'ignore', cwd: ROOT });
            }
            if (!quiet) console.log(`${s}✔ Configured interactive CLI scripts`);
        }

        if (hasExplicit) {
            if (!dryRun) {
                if (hasEnv('staging')) {
                    spawnSync('npm', ['pkg', 'set', 'scripts.android:staging=ENVFILE=.env.staging react-native run-android'], { stdio: 'ignore', cwd: ROOT });
                    spawnSync('npm', ['pkg', 'set', 'scripts.ios:staging=ENVFILE=.env.staging react-native run-ios'], { stdio: 'ignore', cwd: ROOT });
                }
                if (hasEnv('prod')) {
                    spawnSync('npm', ['pkg', 'set', 'scripts.android:prod=ENVFILE=.env.production react-native run-android'], { stdio: 'ignore', cwd: ROOT });
                    spawnSync('npm', ['pkg', 'set', 'scripts.ios:prod=ENVFILE=.env.production react-native run-ios'], { stdio: 'ignore', cwd: ROOT });
                }
            }
            if (!quiet) console.log(`${s}✔ Configured explicit environment scripts`);
        }
        anythingChanged = true;

    } catch (e) {
        if (!quiet) console.error(`${s}❌ Failed to update scripts`);
    }

    if (!anythingChanged) {
        metaInfo.summary = "Environment config checked (already up to date)";
    }

    metaInfo.instructions = hasCli
        ? "Run `npm run ios` or `npm run android` to start with environment selection."
        : "Run `npm run android:staging` (etc) to start.";

    if (!quiet) console.log('✅ react-native-config setup completed.');

    return metaInfo;
}

module.exports = {
    setupReactNativeConfig
};
