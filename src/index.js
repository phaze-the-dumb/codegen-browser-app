const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { spawn } = require('child_process');
const fetch = require('node-fetch');
const fs = require('fs');

let config = {
    appVersion: '0.0.1',
    versions: [],
    position: { x: 0, y: 0 }
}

if(!fs.existsSync(__dirname + '/config.json'))  
    fs.writeFileSync(__dirname + '/config.json', JSON.stringify(config));
else
    config = JSON.parse(fs.readFileSync(__dirname + '/config.json'));

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
        win.webContents.send('fetchConfig', JSON.stringify(config));
    })

    ipcMain.on('log', ( e, log ) => {
        logs.push(JSON.parse(log));
        win.webContents.send('logs', JSON.stringify(logs));
    })

    ipcMain.on('config', ( e, cmd, value ) => {
        if(cmd === 'addVersion'){
            config.versions.push(value)
            fs.writeFileSync(__dirname + '/config.json', JSON.stringify(config));
        }
    })

    ipcMain.on('loadVersion', ( e, version ) => {
        win.webContents.send('loadVersion', fs.readFileSync(__dirname + '/data/codegen/names/'+version+'.json').toString())
    })

    ipcMain.on('openLink', ( event, link ) =>
        shell.openExternal(link));
})