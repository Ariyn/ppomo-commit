import path from 'path';
import { app, BrowserWindow, ipcMain, Menu, Tray } from 'electron' // eslint-disable-line
import timer from '../Modules/timer';
import git from '../Modules/git';

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\') // eslint-disable-line
}

let mainWindow;
let tray;

const winURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9080'
  : `file://${__dirname}/index.html`;

function setEventHandlers(mainWindow, eventContext) {
  const [contextName] = Object.keys(eventContext);
  const { eventHandlers } = eventContext[contextName];

  Object.keys(eventHandlers).forEach((key) => {
    const context = {
      mainWindow,
      key: `${contextName}_${key}`, // make function change this into camelcase.
    };
    console.log(`${context.key} has added`);
    ipcMain.on(context.key, eventHandlers[key].bind(context));
  });
}

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000,
    show: false,
    nodeIntegration: false,
    contextIsolation: true,
  });

  mainWindow.loadURL(winURL);

  if (tray === undefined) {
    tray = new Tray(path.join(__static, 'icon.png'));
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'open window',
        click: () => {
          console.log(mainWindow);

          if (mainWindow === null) {
            createWindow();
          }
        },
      },
      { type: 'separator' },
      {
        label: 'exit',
        click: () => {
          app.quit();
        },
      },
    ]);

    tray.setToolTip('pomodoro');
    tray.setContextMenu(contextMenu);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('focus', () => {
    mainWindow.setProgressBar(-1);
  });

  setEventHandlers(mainWindow, { timer });
  setEventHandlers(mainWindow, { git });
}

app.on('ready', createWindow);

app.on('window-all-closed', (e) => {
  e.preventDefault();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
