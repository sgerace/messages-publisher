/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Start Task
 */
'use strict';

const _ = require('lodash');
const beeper = require('beeper');
const chalk = require('chalk');
const chokidar = require('chokidar');
const tinylr = require('tiny-lr');
const minimatch = require('minimatch');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Configuration

const pkg = require('../package.json');
const config = Object.assign({
    watch: [],
    liveReload: {
        ignorePatterns: []
    }
}, pkg.startConfig);


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Electron

const Electron = require("./ops/electron.op.js");
let electron = new Electron({
    "env": {
        "DEBUG": true,
        "LIVE_RELOAD_PORT": config.liveReload.port
    }
});


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Sass

const Sass = require('./ops/sass.op.js');
let sass = new Sass(config.sass);


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Eslint

const Eslint = require('./ops/eslint.op.js');
const eslint = new Eslint(config.eslint);


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Live Reload Server

const lrport = config.liveReload.port;
let lrserver = tinylr();
lrserver.listen(lrport);


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Initialize

let watcher = null;

async function start() {

    // Start sass and eslint
    sass.start();
    eslint.run();

    // Start electron
    await electron.start();

    // Initialize file watching
    watcher = chokidar.watch(config.watch, {
        ignoreInitial: true
    }).on('all', async (action, filepath) => {
        if (action === 'addDir') {
            return;
        }

        // Report action
        console.log(chalk.yellow(_.startCase(action)) + " " + filepath);

        // Determine if eslint should run
        if (eslint.includes(filepath)) {
            await eslint.run();
        }

        // Trigger live reload (if not ignored)
        let reload = true;
        for (let i = 0; i < config.liveReload.ignorePatterns.length; ++i) {
            if (minimatch(filepath, config.liveReload.ignorePatterns[i])) {
                reload = false;
                break;
            }
        }
        if (reload) {
            lrserver.changed({
                body: {
                    files: [filepath]
                }
            });
        }
    });

    // Stop listeners when electron stops running
    await electron.running().catch(() => { /* suppress */ }).finally(() => {
        electron = null;
        shutdown();
    });
}

start().catch(function(err) {
    console.log(chalk.red(err.stack));
    shutdown();
    beeper();
});


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Shutdown

function shutdown() {
    try {
        if (electron) {
            electron.stop().catch(() => { /* suppress */ });
            electron = null;
        }
        if (lrserver) {
            lrserver.close();
            lrserver = null;
        }
        if (watcher) {
            watcher.close();
            watcher = null;
        }
        if (sass) {
            sass.stop();
            sass = null;
        }
    } catch (err) {
        console.log(chalk.red(err.stack));
        process.exit(1);
    }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', shutdown);
