/**
 * Modular Detox Configuration
 * This defines the "JS Patches" and "File Creations" for the setup.
 */

const DETOX_MODS = [
    // --- NATIVE PATCHES ---
    {
        path: 'android/app/build.gradle',
        patches: [
            {
                id: 'DETOX_ANDROID_DEFAULT_CONFIG',
                hook: /versionName\s+"[^"]+"/,
                transform: (match) => `${match}\n        // DETOX: testInstrumentationRunner\n        testBuildType System.getProperty('testBuildType', 'debug')\n        testInstrumentationRunner 'androidx.test.runner.AndroidJUnitRunner'`
            },
            {
                id: 'DETOX_ANDROID_PROGUARD',
                hook: /proguardFiles\s+getDefaultProguardFile\("proguard-android.txt"\),\s+"proguard-rules.pro"/,
                transform: (match) => `${match}\n            // DETOX: proguard rules\n            proguardFile "\${rootProject.projectDir}/../node_modules/detox/android/detox/proguard-rules-app.pro"`
            },
            {
                id: 'DETOX_ANDROID_DEPS',
                hook: /implementation\("com.facebook.react:react-android"\)/,
                transform: (match) => `${match}\n\n    // DETOX: androidTest dependencies\n    androidTestImplementation('com.wix:detox:+')\n    androidTestImplementation "androidx.test.ext:junit:1.1.3"\n    androidTestImplementation "androidx.fragment:fragment-testing:1.4.1"\n    androidTestImplementation "androidx.test:core:1.4.0"`
            }
        ]
    },
    {
        path: 'android/build.gradle',
        patches: [
            {
                id: 'DETOX_ANDROID_MAVEN_REPO',
                hook: /apply plugin: "com.facebook.react.rootproject"/,
                transform: (match) => `${match}\n\n// DETOX: added Detox maven repo\nallprojects {\n    repositories {\n        maven { url("\$rootDir/../node_modules/detox/Detox-android") }\n    }\n}\n`
            },
            {
                id: 'DETOX_ANDROID_KOTLIN_CLASSPATH',
                hook: /classpath\("org.jetbrains.kotlin:kotlin-gradle-plugin"\)/,
                transform: (match) => `classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:\$kotlinVersion") // DETOX: updated to use version variable`
            }
        ]
    },
    {
        path: 'android/app/src/main/AndroidManifest.xml',
        patches: [
            {
                id: 'DETOX_ANDROID_MANIFEST_NSC',
                hook: /android:supportsRtl="true"/,
                transform: (match) => `${match}\n      android:networkSecurityConfig="@xml/network_security_config"`
            }
        ]
    }
];

const DETOX_FILES = (packageName, appName) => [
    // --- PROJECT CONFIGS ---
    {
        path: '.detoxrc.js',
        content: `const { execSync } = require('child_process');

function pickAnyAVD() {
  const list = execSync('emulator -list-avds').toString().trim().split('\\n');
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
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/${appName}.app',
      build: 'xcodebuild -workspace ios/${appName}.xcworkspace -scheme ${appName} -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build'
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/${appName}.app',
      build: 'xcodebuild -workspace ios/${appName}.xcworkspace -scheme ${appName} -configuration Release -sdk iphonesimulator -derivedDataPath ios/build'
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
`
    },
    {
        path: 'e2e/jest.config.js',
        content: `/** @type {import('@jest/types').Config.InitialOptions} */
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
`
    },
    {
        path: 'e2e/starter.test.js',
        content: `describe('Example', () => {
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
`
    },
    // --- ANDROID NATIVE ASSETS ---
    {
        path: 'android/app/src/main/res/xml/network_security_config.xml',
        content: `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>
`
    },
    {
        path: `android/app/src/androidTest/java/${packageName.replace(/\./g, '/')}/DetoxTest.java`,
        content: `package ${packageName};

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
`
    }
];

module.exports = {
    DETOX_MODS,
    DETOX_FILES
};
