// scripts/utils/spinner.ts

const frames = ["|", "/", "-", "\\"];

let frameIndex = 0;
let spinnerInterval = null;

/**
 * Starts a CLI spinner that animates using | / - \.
 *
 * @param text - Text to display before the spinner.
 */
function startSpinner(text = "Installing dependencies...") {
  frameIndex = 0; // reset each start

  spinnerInterval = setInterval(() => {
    if (!process.stdout.isTTY) {
      // Fallback if not in a real terminal
      return;
    }

    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`${text} ${frames[frameIndex]}`);

    frameIndex = (frameIndex + 1) % frames.length;
  }, 120);
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
  stopSpinner,
};