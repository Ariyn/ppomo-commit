const { app, BrowserWindow } = require('electron')

require('./systemFunctions')

function createWindow () {
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    })

    win.loadFile('static/index.html')
}

var options = {
    name: 'ppomodoro commiter'
}

app.on('ready', createWindow)
