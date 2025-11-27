#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Simple logger with a blank line before each message.
 */
const log = (msg = '') => console.log(`\n${msg}`);

(async () => {
  log('========================================');
  log(' 🎉 Welcome to Your React Native Init Template!');
  log('========================================');

  // TODO: Optionally read this from template package.json
  log('Author: Your Name');
  log('GitHub: https://github.com/yourusername');
  log('Website: https://yourwebsite.com');

  // If not in an interactive terminal (e.g. CI), just exit nicely
  if (!process.stdout.isTTY) {
    log('Non-interactive environment detected. Skipping README customization.');
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (q) =>
    new Promise((resolve) => rl.question(q, (answer) => resolve(answer)));

  try {
    const answer = (await question('\nWould you like to create a README custom section? (yes/no): ')).trim();

    if (answer.toLowerCase().startsWith('y')) {
      const readmePath = path.join(process.cwd(), 'README.md');

      if (!fs.existsSync(readmePath)) {
        log('⚠️  README.md not found. Skipping customization.');
      } else {
        fs.appendFileSync(
          readmePath,
          '\n\n### Custom Section\nThis was added by the template setup script.\n'
        );
        log('📘 README updated successfully!');
      }
    } else {
      log('👍 Okay! Skipping README customization.');
    }
  } catch (err) {
    console.error('\n❌ Error in welcome script:', err);
  } finally {
    rl.close();
  }

  log('✨ Setup complete. Happy coding! ✨');
})();


// Using Chalk for colored output
// #!/usr/bin/env node

// const chalk = require("chalk");

// console.log();
// console.log(chalk.green("🎉  Welcome to the Awesome React Native Template!"));
// console.log();
// console.log(chalk.cyan("Author: John Doe"));
// console.log(chalk.cyan("GitHub: https://github.com/johndoe"));
// console.log(chalk.cyan("Website: https://johndoe.dev"));
// console.log();
// console.log(chalk.yellow("✨ Happy coding!"));
// console.log();
