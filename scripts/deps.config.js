/**
 * Central dependency definition for the template.
 * This file is the single source of truth for all optional dependencies.
 *
 * {
 *   name: string;
 *   version?: string;
 *   isDev?: boolean;
 *   category?: string;
 *   description?: string;
 *
 *   // NEW
 *   postInstall?: string | string[];     // shell commands
 *   setup?: string;                      // JS handler key
 * }
 * 
 * Rules:
 * - `isDev: true`  → devDependencies
 * - `isDev: false` → dependencies
 * - `version` optional → defaults to npm behavior
 */

module.exports = [
    // Core / Networking
    {
        name: 'axios',
        category: 'networking',
        description: 'Promise-based HTTP client',
    },
    // Navigation
    {
        name: '@react-navigation/native',
        category: 'navigation',
        description: 'Core navigation library',
    },
    {
        name: '@react-navigation/native-stack',
        category: 'navigation',
        description: 'Native stack navigator',
    },
    // Storage
    {
        name: '@react-native-async-storage/async-storage',
        category: 'storage',
        description: 'Persistent storage',
    },
    // UI / Icons
    {
        name: 'react-native-vector-icons',
        category: 'ui',
        description: 'Popular icon library',
    },
    // Tooling (Dev)
    {
        name: 'react-native-config',
        category: 'tooling',
        description: 'Manage environment variables',
        setup: "react-native-config"
    },
    {
        name: 'eslint',
        isDev: true,
        category: 'tooling',
        description: 'JavaScript linting',
    },
    {
        name: 'prettier',
        isDev: true,
        category: 'tooling',
        description: 'Code formatter',
    },
    // Testing
    {
        name: 'detox',
        version: '^20.46.0',
        isDev: true,
        category: 'testing',
        description: 'End-to-end testing framework',
        setup: "detox"
    },
];
