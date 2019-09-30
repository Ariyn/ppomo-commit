const fs = require('fs')
const { ipcMain } = require('electron')

ipcMain.on('syncCheckGitInitialized', (event, folder) => {
    console.log(folder)
    event.returnValue = fs.existsSync(folder + '/.git')
})

