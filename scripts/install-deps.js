#!/usr/bin/env node

const readline = require("readline");
const util = require("util");
const { exec } = require("child_process");

// Your dependency list
const DEPENDENCIES = [
  "axios",
  "react-native-vector-icons",
  "@react-navigation/native",
  "@react-navigation/stack",
  "@react-navigation/native-stack",
  "@react-native-async-storage/async-storage",
];

// State to track selected deps
let selected = new Array(DEPENDENCIES.length).fill(false);

// Terminal interface
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

console.clear();
console.log("Which dependencies do you want to install?");
console.log("Press SPACE to toggle, ENTER to confirm.\n");

function renderMenu() {
  console.clear();
  console.log("Which dependencies do you want to install?");
  console.log("Press SPACE to toggle, ENTER to confirm.\n");

  DEPENDENCIES.forEach((dep, i) => {
    const check = selected[i] ? "[x]" : "[ ]";
    console.log(`${check}  ${i + 1}. ${dep}`);
  });

  console.log("\n");
}

renderMenu();

let cursor = 0;

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
    process.exit(0);
  }

  console.log("Installing:");
  chosen.forEach(dep => console.log("  - " + dep));

  console.log("\nRunning npm install...\n");

  const installCommand = `npm install ${chosen.join(" ")}`;

  exec(installCommand, (err, stdout) => {
    if (err) {
      console.error("Error installing dependencies:", err);
    } else {
      console.log(stdout);
      console.log("\n✨ Installation complete!");
    }
    process.exit(0);
  });
}

process.stdin.on("keypress", (str, key) => {
  if (key.name === "c" && key.ctrl) {
    console.log("\nExiting...");
    process.exit();
  }

  if (key.name === "space") toggleSelection();
  if (key.name === "return") installSelected();

  updateCursorMovement(key);
  renderMenu();
});
