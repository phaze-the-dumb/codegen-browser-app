const { app, BrowserWindow, ipcMain, shell } = require('electron');
const fs = require('fs');
const shortcuts = require('windows-shortcuts');
const path = require('path');

let config = {
    appVersion: '0.1.2-beta',
    position: { x: 0, y: 0 },
    devBuild: false
}

let versions = [];

if(!fs.existsSync(__dirname + '/config.json'))  
    fs.writeFileSync(__dirname + '/config.json', JSON.stringify(config));
else
    config = JSON.parse(fs.readFileSync(__dirname + '/config.json'));

if(!config.devBuild)shortcuts.create('%APPDATA%/Microsoft/Windows/Start Menu/Programs/Codegen Browser.lnk', {
    target: path.join(__dirname, '../../../../codegenbrowser.exe'),
    desc: 'Codegen Browser',
    icon: __dirname + '/imgs/browser.png'
});

let __filepath = path.join(__dirname, '../../../../data')

if(config.devBuild)
    __filepath = path.join(__dirname, '../data')

if(!fs.existsSync(__filepath))
    fs.mkdirSync(__filepath)

if(!fs.existsSync(__filepath + '/versions.json'))
    fs.writeFileSync(__filepath + '/versions.json', JSON.stringify(versions));
else
    versions = JSON.parse(fs.readFileSync(__filepath + '/versions.json'));

let logs = [];
let win;

process.on('uncaughtException', ( e ) => {
    logs.push({ type: 'error', log: e });
    win.webContents.send('logs', JSON.stringify(logs));
})

app.on('ready', () => {
    win = new BrowserWindow({
        width: 1200,
        height: 700,
        y: config.position.y,
        x: config.position.x,
        frame: false,
        webPreferences: {
            preload: __dirname + '/preload.js',
            nodeIntegration: true
        }
    })
    
    win.loadFile(__dirname + '/index.html');
    win.setTitle('Codegen Browser');
    win.setIcon(__dirname + '/imgs/browser.png');

    ipcMain.on('load', () => {
        logs.push({ type: 'info', log: 'Window Loaded.' });
        win.webContents.send('logs', JSON.stringify(logs));
    })

    ipcMain.on('close', () => {
        config.position.x = win.getPosition()[0];
        config.position.y = win.getPosition()[1];
        
        fs.writeFileSync(__dirname + '/config.json', JSON.stringify(config));
        win.close();
    })

    ipcMain.on('minimise', () => {
        win.minimize();
    })

    ipcMain.on('fetchConfig', () => {
        win.webContents.send('fetchConfig', JSON.stringify({ versions: versions }));
    })

    ipcMain.on('log', ( e, log ) => {
        logs.push(JSON.parse(log));
        win.webContents.send('logs', JSON.stringify(logs));
    })

    ipcMain.on('config', ( e, cmd, value ) => {
        if(cmd === 'addVersion'){
            versions.push(value)
            fs.writeFileSync(__filepath + '/versions.json', JSON.stringify(versions));
        }
    })

    ipcMain.on('openLink', ( event, link ) =>
        shell.openExternal(link));
})