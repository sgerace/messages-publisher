/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Sass Operation
 */
'use strict';

const chalk = require('chalk');
const spawn = require('child_process').spawn;


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Configuration

const pkg = require('../../package.json');
const script = pkg.scripts.sass;
if (!script) {
    throw new Error('Unable to locate "sass" script in package.json');
}
const tokens = script.split(' ').filter(x => x.length);


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Sass

function Sass() {
    this.name = 'sass';

    // Initialize command
    this.command = tokens[0];

    // Initialize arguments
    this.args = tokens.slice(1);
    if (!this.args.includes('--color')) {
        this.args.push('--color');
    }
    if (!this.args.includes('--watch')) {
        this.args.push('--watch');
    }

    // Initialize process
    this._process = null;
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Public methods

Sass.prototype.start = function() {
    if (this._process) {
        return;
    }

    // Spawn child process
    console.log(chalk.magenta('Starting Sass...'));
    this._process = spawn(this.command, this.args, { stdio: 'inherit', shell: true });
};

Sass.prototype.stop = function() {
    this._process.kill();
};


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Exports

module.exports = Sass;
