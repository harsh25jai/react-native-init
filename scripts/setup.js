#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const SCRIPTS_DIR = __dirname;

/**
 * Run a Node script in the project root.
 * @param {string} scriptName - File name inside scripts/ (e.g. "welcome.js")
 * @returns {Promise<void>}
 */
function runNodeScript(scriptName) {
  const scriptPath = path.join(SCRIPTS_DIR, scriptName);

  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',       // needed for interactive prompts
      cwd: process.cwd(),     // run from new app's root
    });

    child.on('error', (err) => {
      reject(err);
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${scriptName} exited with code ${code}`));
      }
    });
  });
}

(async () => {
  try {
    // 1. Welcome script (optional, interactive)
    // await runNodeScript('welcome.js');

    // 2. Dependency installer (interactive, npm-only)
    await runNodeScript('install-deps.js');

    console.log('\n✅ Setup complete. Happy coding!\n');
  } catch (error) {
    console.error('\n❌ Error during setup:', error.message || error);
    process.exit(1);
  }
})();
