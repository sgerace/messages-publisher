/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 * Electron Main Application
 */
'use strict';

const electron = require('electron');

const app = electron.app; // Module to control application life
const BrowserWindow = electron.BrowserWindow; // Module to create native browser window

// const dialog = electron.dialog;
const ipc = electron.ipcMain;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// const menu = require('./main/menu');
const BrowserWindowStateManager = require('./main/stateManager'); // Module to manage window state


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Configuration

if (!process.env.DEBUG) {
    process.env.NODE_ENV = "production";
}


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Initialization

Promise.all([
    electron.app.whenReady()
]).then(function() {
    createWindow();
});


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Create window

function createWindow() {

    // Initialize state manager
    const stateManager = new BrowserWindowStateManager({
        width: 1024,
        height: 768,
        minWidth: 1024,
        minHeight: 768
    });

    // Create the browser window.
    mainWindow = new BrowserWindow(stateManager.getOptions());

    // Configure state manager
    stateManager.manage(mainWindow);

    // and load the index.html of the app.
    mainWindow.loadFile('renderer/index.html');

    // Open the DevTools.
    if (process.env.DEBUG) {
        mainWindow.webContents.openDevTools();
    }

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {

        // var url = mainWindow.webContents.getURL();

        // Get size of window before closing and set config, this needs to happen synchronously
        // Config.setConfig('bounds', mainWindow.getBounds());

        // Set route they were last on from URL
        // Config.setConfig('lastPage', url.substring(url.indexOf('#') + 2));

        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

// Quit when all windows are closed.
app.on('window-all-closed', function() {

    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function() {

    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Handles

ipc.handle('getUserDataPath', () => {
    return app.getPath('userData');
});


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Report ready

console.log("Electron ready");
