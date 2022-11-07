/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Electron Operation
 */
'use strict';

const chalk = require('chalk');
const fspath = require('path');
const spawn = require('child_process').spawn;
const os = require('os');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Electron

function Electron(options) {
    this._options = options || {};
    this._process = null;
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Public methods

Electron.prototype.restart = async function() {
    console.log(chalk.cyan('Restarting') + " Electron");
    this._restarting = true;
    await this.stop();
    await this.start();
    this._restarting = false;
};

Electron.prototype.running = function() {
    return this._running;
};

Electron.prototype.start = function() {
    const electron = this;
    if (this._process) {
        return this._init;
    }

    // Spawn child process
    console.log(chalk.magenta('Starting Electron...'));
    let cmd;
    if (os.platform() === 'win32') {
        cmd = fspath.join('node_modules', '.bin', 'electron.cmd');
    } else {
        cmd = 'electron';
    }
    this._process = spawn(cmd, ['.'], {
        env: Object.assign({}, process.env, (this._options.env || {}), {
            FORCE_COLOR: true
        }),
        stdio: ['ignore', 'pipe', 'inherit']
    });

    // Create initialization promise
    this._initHandled = false;
    this._init = new Promise(function(resolve, reject) {
        electron._initResolve = resolve;
        electron._initReject = reject;
    });

    // Create running promise
    this._runningHandled = false;
    this._running = new Promise(function(resolve, reject) {
        electron._runningResolve = resolve;
        electron._runningReject = reject;
    });

    // Monitor and pipe process stdout
    this._process.stdout.on('data', function(data) {
        const message = "" + data;
        const regex = new RegExp("Electron ready", "gi");
        if (regex.test(message)) { // Definitely need a better way to do this!
            electron._initHandled = true;
            electron._initResolve();
        }
    });
    this._process.stdout.pipe(process.stdout);

    // Ensure electron is stopped on process exit
    this._process.on('exit', this._onExit.bind(this));

    // Return promise
    return this._init;
};

Electron.prototype.stop = function( /* code */ ) {
    if (this._process && this._process.kill) {
        this._process.kill('SIGTERM');
        return this._running;
    } else {
        return Promise.resolve();
    }
};


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Private methods

Electron.prototype._onExit = function(code) {
    if (this._process) {
        this._process.removeAllListeners('close');
        this._process.removeAllListeners('exit');
        this._process = null;
    }
    if (!this._initHandled) {
        this._initHandled = true;
        this._runningHandled = true;
        this._initReject(code);
        this._runningReject(code);
    } else if (!this._runningHandled) {
        this._runningHandled = true;
        if (code === 0) {
            this._runningResolve();
        } else {
            this._runningReject(code);
        }
    }
};


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Exports

module.exports = Electron;
