/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Eslint Operation
 */
'use strict';

const beeper = require('beeper');
const chalk = require('chalk');
const fs = require('fs');
const fspath = require('path');
const minimatch = require('minimatch');

const { ESLint } = require("eslint");


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Configuration

const pkg = require('../../../package.json');
const script = pkg.scripts.eslint;
if (!script) {
    throw new Error('Unable to locate "eslint" script in package.json');
}
const patterns = script.split(' ').filter(x => {
    return x.length && x !== 'npx' && x !== 'eslint' && !x.startsWith('-') && !x.startsWith('--');
});
const filters = patterns.map(x => {
    const rel = fspath.relative(process.cwd(), x);
    if (!rel) {
        return '**/*.js';
    } else if (rel.endsWith('.js')) {
        return rel;
    } else if (fs.statSync(rel).isDirectory()) {
        return `${rel}/**/*.js`;
    }
}).filter(x => !!x);


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Eslint

function Eslint() {}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Public methods

Eslint.prototype.includes = function(filepath) {
    for (let i = 0; i < filters.length; ++i) {
        if (minimatch(filepath, filters[i])) {
            return true;
        }
    }
    return false;
};

Eslint.prototype.run = async function() {
    if (this._promise) {
        this._pending = true;
        return this._promise;
    }
    return (this._promise = Promise.resolve().then(async () => {
        console.log(chalk.magenta('Running Eslint...'));

        // Create instance
        const eslint = new ESLint({ cache: true });

        // Lint files
        const results = await eslint.lintFiles(patterns);

        // Format the results
        const formatter = await eslint.loadFormatter("stylish");
        const resultText = formatter.format(results);

        // Write output
        if (resultText) {
            process.stdout.write(resultText);
        } else {
            console.log(chalk.green('Eslint finished'));
        }

        // Beep if any errors occurred
        const errorCount = results.reduce((prev, curr) => prev + curr.errorCount, 0);
        if (errorCount > 0) {
            beeper();
        }
    }).finally(() => {
        this._promise = null;
        if (this._pending) {
            this._pending = false;
            return this._run();
        }
    }));
};


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Exports

module.exports = Eslint;
