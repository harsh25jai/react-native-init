// scripts/utils/spinner.ts

const frames = ["|", "/", "-", "\\"];

let frameIndex = 0;
let spinnerInterval = null;
let currentText = "";

/**
 * Starts a CLI spinner that animates using | / - \.
 *
 * @param text - Text to display before the spinner.
 */
function startSpinner(text = "Installing dependencies...") {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
  }

  frameIndex = 0; // reset each start
  currentText = text;

  spinnerInterval = setInterval(() => {
    if (!process.stdout.isTTY) {
      // Fallback if not in a real terminal
      return;
    }

    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`${currentText} ${frames[frameIndex]}`);

    frameIndex = (frameIndex + 1) % frames.length;
  }, 120);
}

/**
 * Updates the text display while the spinner is running.
 * @param text - New text to display.
 */
function updateText(text) {
  currentText = text;
}

/**
 * Stops the spinner and optionally prints a final line of text.
 *
 * @param finalText - Optional text to show after stopping the spinner.
 */
function stopSpinner(finalText = "") {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
    spinnerInterval = null;
  }

  if (process.stdout.isTTY) {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
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