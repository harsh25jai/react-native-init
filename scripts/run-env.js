#!/usr/bin/env node
const prompts = require('prompts');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { spacing, format } = require('./utils/constants');

async function run() {
    try {
        // 1. Determine Platform
        let platform = process.argv[2]; // node scripts/run-env.js android
        if (!platform || !['android', 'ios'].includes(platform)) {
            const response = await prompts({
                type: 'select',
                name: 'platform',
                message: 'Select Platform',
                choices: [
                    { title: 'iOS', value: 'ios' },
                    { title: 'Android', value: 'android' }
                ]
            });
            platform = response.platform;
        }
        if (!platform) return; // User cancelled

        // 2. Select Environment
        // Check which env files exist
        const envs = [
            { id: 'dev', file: '.env', label: 'Dev' },
            { id: 'staging', file: '.env.staging', label: 'Staging' },
            { id: 'prod', file: '.env.production', label: 'Production' },
        ];

        const choices = envs.map(e => {
            const exists = fs.existsSync(path.join(process.cwd(), e.file));
            return {
                title: `${e.label.padEnd(10)} ${format.dim(`(${e.file})`)}`,
                value: e.file,
                description: exists ? '' : '[Missing File]',
                disabled: !exists
            };
        });

        const { envFile } = await prompts({
            type: 'select',
            name: 'envFile',
            message: 'Select Environment',
            choices: choices,
            initial: 0
        });

        if (!envFile) {
            console.log(format.red('\n✖ Operation cancelled.'));
            return;
        }

        // 3. Optional: Reset Cache
        // Only ask if not passed explicitly? Or always good to have?
        // User didn't strictly ask for it in CLI hijack but it's a nice feature I planned.
        // Let's skip it for now to keep the flow fast, or make it optional via flag?
        // Actually, the "visual preview" didn't show it as a prompt.
        // I'll stick to the preview: "Select Environment" -> Run.
        // But maybe I'll check for --reset-cache arg.

        const extraArgs = process.argv.slice(3).join(' ');

        // 4. Construct Command
        const cmd = `ENVFILE=${envFile} react-native run-${platform} ${extraArgs}`;

        console.log(format.cyan(`\n> ${cmd}\n`));

        spawnSync(cmd, { stdio: 'inherit', shell: true });

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
