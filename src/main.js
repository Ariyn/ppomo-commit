const { app, BrowserWindow } = require('electron');

require('./systemFunctions');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  win.loadFile('static/index.html');
}

const options = {
  name: 'ppomodoro commiter',
};

app.on('ready', createWindow);
