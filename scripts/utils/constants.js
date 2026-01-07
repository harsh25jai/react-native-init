/**
 * Minimal ANSI color utility for terminal output.
 */
const colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
};

const format = {
    green: (text) => `${colors.bold}${colors.green}${text}${colors.reset}`,
    cyan: (text) => `${colors.bold}${colors.cyan}${text}${colors.reset}`,
    magenta: (text) => `${colors.bold}${colors.magenta}${text}${colors.reset}`,
    bold: (text) => `${colors.bold}${text}${colors.reset}`,
};

const spacing = {
    s2: '  ',
    s3: '   ',
    s4: '    ',
    s5: '     ',
    tab: '  ',
};

module.exports = {
    colors,
    format,
    spacing,
};
