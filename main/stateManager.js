/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * State Manager
 */

const _ = require('lodash');
const electron = require('electron');
const fs = require('fs');
const fspath = require('path');


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Constructor

function BrowserWindowStateManager(options) {
    this.app = electron.app || electron.remote.app;
    this.screen = electron.screen || electron.remote.screen;
    this.win = null;
    this.state = null;

    // Initialize full path
    this.fullpath = fspath.join(this.app.getPath('userData'), 'state.json');

    // Load previous state
    try {
        this.state = JSON.parse(fs.readFileSync(this.fullpath));
    } catch (err) { /* ignore */ }

    // Check state validity
    this._validateState();

    // Set defaults
    this.state = _.assign({
        maximized: false,
        fullScreen: false
    }, options, this.state);

    // Event handlers
    this._stateChangeHandler = _.throttle(() => this._updateState(), 200);
    this._closeHandler = () => {
        this._updateState();
    };
    this._closedHandler = () => {
        this.unmanage();
        this.save();
    };
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Public methods

BrowserWindowStateManager.prototype.getOptions = function() {
    return {
        x: this.state.x,
        y: this.state.y,
        width: this.state.width,
        height: this.state.height,
        minWidth: this.state.minWidth,
        minHeight: this.state.minHeight,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            enableRemoteModule: true
        }
    };
};

BrowserWindowStateManager.prototype.manage = function(win) {
    if (this.state.maximized) {
        win.maximize();
    }
    if (this.state.fullScreen) {
        win.setFullScreen(true);
    }
    win.on('resize', this._stateChangeHandler);
    win.on('move', this._stateChangeHandler);
    win.on('close', this._closeHandler);
    win.on('closed', this._closedHandler);
    this.win = win;
};

BrowserWindowStateManager.prototype.save = function() {
    try {
        fs.mkdirSync(fspath.dirname(this.fullpath), { recursive: true });
        fs.writeFileSync(this.fullpath, JSON.stringify(this.state, null, 4));
    } catch (err) {
        console.log(err);
    }
};

BrowserWindowStateManager.prototype.unmanage = function() {
    if (this.win) {
        this.win.removeListener('resize', this._stateChangeHandler);
        this.win.removeListener('move', this._stateChangeHandler);
        this.win.removeListener('close', this._closeHandler);
        this.win.removeListener('closed', this._closedHandler);
        this.win = null;
    }
};


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Private methods

BrowserWindowStateManager.prototype._hasBounds = function() {
    return this.state &&
        Number.isInteger(this.state.x) &&
        Number.isInteger(this.state.y) &&
        Number.isInteger(this.state.width) && this.state.width > 0 &&
        Number.isInteger(this.state.height) && this.state.height > 0;
};

BrowserWindowStateManager.prototype._isNormal = function() {
    return !this.win.isMaximized() && !this.win.isMinimized() && !this.win.isFullScreen();
};

BrowserWindowStateManager.prototype._updateState = function() {
    if (!this.win) {
        return;
    }
    try {
        const bounds = this.win.getBounds();
        if (this._isNormal()) {
            this.state.x = bounds.x;
            this.state.y = bounds.y;
            this.state.width = bounds.width;
            this.state.height = bounds.height;
        }
        this.state.maximized = this.win.isMaximized();
        this.state.fullScreen = this.win.isFullScreen();
        this.state.displayBounds = this.screen.getDisplayMatching(bounds).bounds;
    } catch (err) { /* ignore */ }
};

BrowserWindowStateManager.prototype._validateState = function( /* state */ ) {
    const valid = this.state && (this._hasBounds() || this.state.maximized || this.state.fullScreen);
    if (!valid) {
        this.state = null;
        return;
    }

    // Check if the display where the window was last open is still available
    if (this._hasBounds() && this.state.displayBounds) {
        const displayBounds = this.screen.getDisplayMatching(this.state).bounds;
        if (!_.isEqual(this.state.displayBounds, displayBounds)) {
            if (displayBounds.width < this.state.displayBounds.width) {
                if (this.state.x > displayBounds.width) {
                    this.state.x = 0;
                }
                if (this.state.width > displayBounds.width) {
                    this.state.width = displayBounds.width;
                }
            }
            if (displayBounds.height < this.state.displayBounds.height) {
                if (this.state.y > displayBounds.height) {
                    this.state.y = 0;
                }
                if (this.state.height > displayBounds.height) {
                    this.state.height = displayBounds.height;
                }
            }
        }
    }
};


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Exports

module.exports = BrowserWindowStateManager;
