#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const util = require("util");

// A small helper to print nicely
const log = (msg) => console.log(`\n${msg}`);

(async () => {
  log("========================================");
  log(" 🎉 Welcome to Your React Native Template!");
  log("========================================");

  log("Author: Your Name");
  log("GitHub: https://github.com/yourusername");
  log("Website: https://yourwebsite.com");

  // Optional: Ask user a question (using readline)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = util.promisify(rl.question).bind(rl);

  try {
    const answer = await question("\nWould you like to create a README custom section? (yes/no): ");

    if (answer.toLowerCase().startsWith("y")) {
      const readmePath = path.join(process.cwd(), "README.md");

      fs.appendFileSync(
        readmePath,
        "\n\n### Custom Section\nThis was added by the template setup script.\n"
      );

      log("📘 README updated successfully!");
    } else {
      log("👍 Okay! Skipping README customization.");
    }
  } catch (err) {
    console.error("Error:", err);
  }

  rl.close();
  log("\n✨ Setup complete. Happy coding! ✨");
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

