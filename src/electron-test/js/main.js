'use strict';

// Third Party Dependencies
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let id = 1;

function createWindow(url) {
    let newWinOpts = {
        title: 'Window-' + id,
        show: true,
        alwaysOnTop: false,
        webPreferences: {
            devTools: true,
            sandbox: false,
            nodeIntegration: false,
            allowRunningInsecureContent: true,
            webSecurity: false,
        }
    };
    let win = new BrowserWindow(newWinOpts);
    win.webContents.openDevTools();
    win.winName = 'win' + id;
    id++;
    // win.loadFile(url);
    win.loadURL(url)
}

app.commandLine.appendSwitch('--ignore-certificate-errors');

app.on('ready', () => {
   createWindow('https://local-dev.qa3.symphony.com:3000/win.html');
   createWindow('https://local-dev.qa3.symphony.com:3000/win.html');
});
