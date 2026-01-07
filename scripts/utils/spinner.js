// scripts/utils/spinner.js
const readline = require('readline');

const frames = ["|", "/", "-", "\\"];

let frameIndex = 0;
let spinnerInterval = null;
let currentText = "";

/**
 * Internal render function
 */
function render() {
  if (!process.stdout.isTTY) {
    return;
  }
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(`${currentText} ${frames[frameIndex]}`);
}

/**
 * Starts a CLI spinner that animates using | / - \.
 * @param text - Text to display before the spinner.
 */
function startSpinner(text = "  Installing dependencies...") {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
  }

  frameIndex = 0;
  currentText = text;

  if (process.stdout.isTTY) {
    render();
    spinnerInterval = setInterval(() => {
      frameIndex = (frameIndex + 1) % frames.length;
      render();
    }, 120);
  } else {
    // Non-TTY Fallback: Just log the text once
    console.log(`[i] ${text}`);
  }
}

/**
 * Updates the text display while the spinner is running.
 * @param text - New text to display.
 */
function updateText(text) {
  currentText = text;
  if (!process.stdout.isTTY) {
    console.log(`[i] ${text}`);
  } else {
    render();
  }
}

/**
 * Stops the spinner and optionally prints a final line of text.
 * @param finalText - Optional text to show after stopping the spinner.
 */
function stopSpinner(finalText = "") {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
    spinnerInterval = null;
  }

  if (process.stdout.isTTY) {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
  }

  if (finalText) {
    process.stdout.write(finalText + "\n");
  }
}

module.exports = {
  startSpinner,
  updateText,
  stopSpinner,
};