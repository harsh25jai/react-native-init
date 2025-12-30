const fs = require('fs');
const path = require('path');

function writeIfMissing(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(filePath)) {
    return false;
  }
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

function insertAfter(filePath, matchRegex, insertText) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(insertText.trim())) return false;
  const match = content.match(matchRegex);
  if (!match) return false;
  const idx = match.index + match[0].length;
  const updated = content.slice(0, idx) + '\n' + insertText + content.slice(idx);
  fs.writeFileSync(filePath, updated, 'utf8');
  return true;
}

function replaceInFile(filePath, searchRegex, replaceText) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(replaceText.trim())) return false;
  const updated = content.replace(searchRegex, replaceText);
  if (updated === content) return false;
  fs.writeFileSync(filePath, updated, 'utf8');
  return true;
}

module.exports = {
  applyFallback(projectRoot = process.cwd()) {
    const created = [];
    const changed = [];

    // 1) Create .detoxrc.js at repo root
    const detoxrc = `const { execSync } = require('child_process');

function pickAnyAVD() {
  const list = execSync('emulator -list-avds').toString().trim().split('\n');
  return list[0]; // pick first available
}

/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      '$0': 'jest',
      config: 'e2e/jest.config.js'
    },
    jest: {
      setupTimeout: 120000
    }
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/reactNativeInit.app',
      build: 'xcodebuild -workspace ios/reactNativeInit.xcworkspace -scheme reactNativeInit -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/reactNativeInit.app',
      build: 'xcodebuild -workspace ios/reactNativeInit.xcworkspace -scheme reactNativeInit -configuration Release -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [
        8081
      ]
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15'
      }
    },
    attached: {
      type: 'android.attached',
      device: {
        adbName: '.*'
      }
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: pickAnyAVD()
      }
    }
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug'
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release'
    },
    'android.att.debug': {
      device: 'attached',
      app: 'android.debug'
    },
    'android.att.release': {
      device: 'attached',
      app: 'android.release'
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug'
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release'
    }
  }
};
`;
    const detoxrcPath = path.join(projectRoot, '.detoxrc.js');
    if (writeIfMissing(detoxrcPath, detoxrc)) created.push(detoxrcPath);

    // 2) Create e2e/jest.config.js
    const e2eJest = `/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};
`;
    const e2eJestPath = path.join(projectRoot, 'e2e', 'jest.config.js');
    if (writeIfMissing(e2eJestPath, e2eJest)) created.push(e2eJestPath);

    // 3) Create e2e/starter.test.js
    const e2eTest = `describe('Example', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should have welcome screen', async () => {
    await expect(element(by.id('welcome'))).toBeVisible();
  });

  it('should show hello screen after tap', async () => {
    await element(by.id('hello_button')).tap();
    await expect(element(by.text('Hello!!!'))).toBeVisible();
  });

  it('should show world screen after tap', async () => {
    await element(by.id('world_button')).tap();
    await expect(element(by.text('World!!!'))).toBeVisible();
  });

  it.only('should have welcome react native screen', async () => {
    await expect(element(by.text('Welcome to React Native'))).toBeVisible();
  });
});
`;
    const e2eTestPath = path.join(projectRoot, 'e2e', 'starter.test.js');
    if (writeIfMissing(e2eTestPath, e2eTest)) created.push(e2eTestPath);

    // 4) Add network_security_config.xml and reference in AndroidManifest
    const nsConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
`;
    const nsPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml', 'network_security_config.xml');
    if (writeIfMissing(nsPath, nsConfig)) created.push(nsPath);

    // Update AndroidManifest: add networkSecurityConfig attribute
    const manifestPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
    if (fs.existsSync(manifestPath)) {
      const added = replaceInFile(manifestPath,
        /android:allowBackup="[^"]*"[\s\S]*?>/m,
        match => match.replace(/>$/, '  android:networkSecurityConfig="@xml/network_security_config">')
      );
      // If replaceInFile's replace didn't change (because regex didn't match exactly), try a simpler insertion
      if (!added) {
        const content = fs.readFileSync(manifestPath, 'utf8');
        if (!content.includes('@xml/network_security_config')) {
          const updated = content.replace('android:theme="@style/AppTheme"', 'android:theme="@style/AppTheme"\n      android:networkSecurityConfig="@xml/network_security_config"');
          if (updated !== content) {
            fs.writeFileSync(manifestPath, updated, 'utf8');
            changed.push(manifestPath);
          }
        }
      } else {
        changed.push(manifestPath);
      }
    }

    // 5) Modify android/app/build.gradle: add testBuildType and testInstrumentationRunner
    const appBuildGradle = path.join(projectRoot, 'android', 'app', 'build.gradle');
    if (fs.existsSync(appBuildGradle)) {
      const inserted = insertAfter(appBuildGradle, /versionName\s+"[^"]+"/, `        // react-native detox\n        testBuildType System.getProperty('testBuildType', 'debug')\n        testInstrumentationRunner 'androidx.test.runner.AndroidJUnitRunner'`);
      if (inserted) changed.push(appBuildGradle);

      // add androidTestImplementation deps
      const depsInserted = insertAfter(appBuildGradle, /dependencies\s*\{/, `    // react-native detox\n    androidTestImplementation('com.wix:detox:+')\n    androidTestImplementation "androidx.test.ext:junit:1.1.3"\n    androidTestImplementation "androidx.fragment:fragment-testing:1.4.1"\n    androidTestImplementation "androidx.test:core:1.4.0"`);
      if (depsInserted) changed.push(appBuildGradle);

      // add proguard file line in release block
      const proguardAdded = insertAfter(appBuildGradle, /proguardFiles\s+getDefaultProguardFile\(.*\),\s*"proguard-rules.pro"/, `            // react-native detox\n            proguardFile "${rootDir}/../node_modules/detox/android/detox/proguard-rules-app.pro"`);
      if (proguardAdded) changed.push(appBuildGradle);
    }

    // 6) Modify android/build.gradle to add Detox maven repo
    const rootBuildGradle = path.join(projectRoot, 'android', 'build.gradle');
    if (fs.existsSync(rootBuildGradle)) {
      if (!fs.readFileSync(rootBuildGradle, 'utf8').includes('Detox-android')) {
        const repoBlock = `\n// react-native detox\nallprojects {\n    repositories {\n        maven { url("$rootDir/../node_modules/detox/Detox-android") }\n    }\n}\n`;
        fs.appendFileSync(rootBuildGradle, repoBlock, 'utf8');
        changed.push(rootBuildGradle);
      }
    }

    // 7) Create androidTest Java file
    const detoxTestPath = path.join(projectRoot, 'android', 'app', 'src', 'androidTest', 'java', 'com', 'reactnativeinit', 'DetoxTest.java');
    const detoxTestContent = `package com.reactnativeinit;

import com.wix.detox.Detox;
import com.wix.detox.config.DetoxConfig;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;
import androidx.test.rule.ActivityTestRule;

@RunWith(AndroidJUnit4.class)
@LargeTest
public class DetoxTest {
    @Rule
    public ActivityTestRule<MainActivity> mActivityRule = new ActivityTestRule<>(MainActivity.class, false, false);

    @Test
    public void runDetoxTests() {
        DetoxConfig detoxConfig = new DetoxConfig();
        detoxConfig.idlePolicyConfig.masterTimeoutSec = 90;
        detoxConfig.idlePolicyConfig.idleResourceTimeoutSec = 60;
        detoxConfig.rnContextLoadTimeoutSec = (BuildConfig.DEBUG ? 180 : 60);

        Detox.runTests(mActivityRule, detoxConfig);
    }
}
`;
    if (writeIfMissing(detoxTestPath, detoxTestContent)) created.push(detoxTestPath);

    return { created, changed };
  }
};
