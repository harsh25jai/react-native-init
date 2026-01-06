const fs = require('fs');
const path = require('path');
const prompts = require('prompts');

/**
 * Load, prompt, and update command history for Detox scripts.
 * If history exists, prompts the user to reuse the most used or last used command.
 * Returns the selected command (or null to start fresh) and a method to update the history.
 *
 * @returns {Promise<{ command: string | null, saveToHistory: (command: string) => void }>}
 */
async function handleCommandHistory(script) {
  const HISTORY_PATH = path.resolve(__dirname, `.history/.${script}_history.json`);

  function ensureDirExists(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  function loadHistory() {
    try {
      return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
    } catch (error) {
      return [];
    }
  }

  function saveToHistory(command) {
    let history = loadHistory();
    const now = new Date().toISOString();

    const existing = history.find((entry) => entry.command === command);
    if (existing) {
      existing.count++;
      existing.lastUsed = now;
    } else {
      history.push({ command, count: 1, lastUsed: now });
    }
    ensureDirExists(HISTORY_PATH);
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(history.slice(-20), null, 2)); // keep last 20
  }

  let history = loadHistory();

  const getMostUsed = () => [...history].sort((a, b) => b.count - a.count)[0];

  const getLastUsed = () =>
    [...history].sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))[0];

  const mostUsed = getMostUsed();
  const lastUsed = getLastUsed();

  const recentChoices = [];

  if (mostUsed) {
    recentChoices.push({
      title: `Re-run most used: ${mostUsed.command}`,
      value: mostUsed.command,
    });
  }

  if (lastUsed && (!mostUsed || lastUsed.command !== mostUsed.command)) {
    recentChoices.push({
      title: `Re-run last used: ${lastUsed.command}`,
      value: lastUsed.command,
    });
  }

  let recentCommand = null;
  if (recentChoices.length > 0) {
    recentChoices.push({ title: 'Run new command', value: null });

    const response = await prompts({
      type: 'select',
      name: 'recentCommand',
      message: 'Use previous command or start fresh?',
      choices: recentChoices,
    });

    recentCommand = response.recentCommand;
  }

  return {
    recentCommand,
    saveToHistory,
    loadHistory,
  };
}

module.exports = {
  handleCommandHistory,
};
