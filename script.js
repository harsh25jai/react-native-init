#!/usr/bin/env node

console.log("This is post init script");

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { promisify } = require('util');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = promisify(rl.question).bind(rl);

const customEslintConfig = `module.exports = {
  root: true,
  extends: [
    '@react-native',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['react', 'react-native', '@typescript-eslint', 'prettier'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error'],
    '@typescript-eslint/no-explicit-any': 'error',
    'prettier/prettier': 'error',
    'react-native/no-unused-styles': 'error',
    'react-native/no-inline-styles': 'error',
    'react-native/no-raw-text': ['error', { skip: ['CustomText'] }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  env: {
    'react-native/react-native': true,
  },
};`;

async function init() {
  try {
    const useCustomEslint = await question('Would you like to use custom ESLint configuration? (y/n): ');
    
    if (useCustomEslint.toLowerCase() === 'y') {
      // Add dependencies to package.json
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = require(packageJsonPath);
      
      packageJson.devDependencies = {
        ...packageJson.devDependencies,
        '@typescript-eslint/eslint-plugin': '^6.0.0',
        '@typescript-eslint/parser': '^6.0.0',
        'eslint-plugin-react': '^7.33.2',
        'eslint-plugin-react-native': '^4.0.0',
        'eslint-config-prettier': '^9.0.0',
        'eslint-plugin-prettier': '^5.0.0',
      };

      // Write updated package.json
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

      // Write custom ESLint config
      fs.writeFileSync(path.join(process.cwd(), '.eslintrc.js'), customEslintConfig);
      
      console.log('✅ Custom ESLint configuration has been set up!');
      console.log('📦 Installing additional dependencies...');
      
      // You might want to run npm install here using child_process.execSync
    }
    
    rl.close();
  } catch (error) {
    console.error('Error during initialization:', error);
    process.exit(1);
  }
}

init();