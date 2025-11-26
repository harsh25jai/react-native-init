#!/usr/bin/env node

console.log("This is post init script");

const { spawn } = require("child_process");
const path = require("path");


async function init() {
  try {
    const welcomeScript = path.join(__dirname, "welcome.js");

    const welcomeChild = spawn("node", [welcomeScript], {
      stdio: "inherit",  // IMPORTANT: required for the interactive menu to work
      cwd: process.cwd(), // run from project's root
    });

    const installDepsScript = path.join(__dirname, "install-deps.js");

    const installDepsChild = spawn("node", [installDepsScript], {
      stdio: "inherit",  // IMPORTANT: required for the interactive menu to work
      cwd: process.cwd(), // run from project's root
    });

  } catch (error) {
    console.error('Error during initialization:', error);
    process.exit(1);
  }
}

init();