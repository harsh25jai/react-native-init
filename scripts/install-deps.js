#!/usr/bin/env node

const readline = require("readline");
const { exec } = require("child_process");
const { startSpinner, stopSpinner } = require("./utils/spinner");

const DEPENDENCIES = [
  "axios",
  "react-native-vector-icons",
  "@react-navigation/native",
  "@react-navigation/stack",
  "@react-navigation/native-stack",
  "@react-native-async-storage/async-storage",
  "react-query"
];

let selected = new Array(DEPENDENCIES.length).fill(false);
let cursor = 0;

// Only run interactively in a real terminal
if (!process.stdin.isTTY) {
  console.log("Non-interactive environment detected. Skipping dependency selector.");
  process.exit(0);
}

readline.emitKeypressEvents(process.stdin);
if (process.stdin.setRawMode) {
  process.stdin.setRawMode(true);
}

console.clear();

function renderMenu() {
  console.clear();
  console.log("Which dependencies do you want to install?");
  console.log("Use ↑/↓ to move, SPACE to toggle, ENTER to confirm.\n");

  DEPENDENCIES.forEach((dep, i) => {
    const check = selected[i] ? "[x]" : "[ ]";
    const pointer = i === cursor ? ">" : " ";
    console.log(`${pointer} ${check}  ${i + 1}. ${dep}`);
  });

  console.log("\nPress Ctrl+C to exit.\n");
}

function updateCursorMovement(key) {
  if (key.name === "down") cursor = (cursor + 1) % DEPENDENCIES.length;
  else if (key.name === "up") cursor = (cursor - 1 + DEPENDENCIES.length) % DEPENDENCIES.length;
}

function toggleSelection() {
  selected[cursor] = !selected[cursor];
}

function installSelected() {
  const chosen = DEPENDENCIES.filter((_, idx) => selected[idx]);

  console.clear();

  if (chosen.length === 0) {
    console.log("No dependencies selected. Exiting.");
    cleanup(0);
  }

  console.log("Installing:");
  chosen.forEach((dep) => console.log("  - " + dep));

  console.log("\nRunning: npm install ...\n");
  startSpinner();

  const installCommand = `npm install ${chosen.join(" ")}`;
  
  const child = exec(installCommand, (err, stdout) => {
    if (stdout) console.log(stdout);

    if (err) {
      stopSpinner("❌ Installation failed");
      console.error("Error installing dependencies:", err);
      cleanup(1);
    } else {
      stopSpinner("✔ Installation complete");
      console.log("\n✨ Installation complete!");
      cleanup(0);
    }
  });

  // Mirror real-time npm output
  child.stdout?.pipe(process.stdout);
  child.stderr?.pipe(process.stderr);
}

function cleanup(code) {
  if (process.stdin.setRawMode) {
    process.stdin.setRawMode(false);
  }
  process.exit(code);
}

process.stdin.on("keypress", (_str, key) => {
  if (key.name === "c" && key.ctrl) {
    console.log("\nExiting...");
    return cleanup(0);
  }

  if (key.name === "space") toggleSelection();
  if (key.name === "return") return installSelected();

  updateCursorMovement(key);
  renderMenu();
});

renderMenu();
