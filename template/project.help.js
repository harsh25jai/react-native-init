// help.js
const fs = require('fs');

// Read the package.json file
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

// Extract scripts
const scripts = packageJson.scripts;

console.log('Available Commands:');
console.log('-------------------');

// Display each command
for (const [command, description] of Object.entries(scripts)) {
  console.log(`- ${command}: ${description}`);
}
