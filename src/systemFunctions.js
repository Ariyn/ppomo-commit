const fs = require('fs')
const { exec } = require('child_process')

const { ipcMain } = require('electron')

const BRANCH_NAME = 'ppomo-commit'
let index = 0;

ipcMain.on('syncCheckGitInitialized', (event, folder) => {
    event.returnValue = fs.existsSync(folder + '/.git')
})

ipcMain.on('asyncSetGitFolder', (event, path) => {
    setGitFolder(path)
        .then(() => {
            event.reply('asyncSetGitFolder', {
                'status': 'success',
                'path': path
            })
        })
        .catch((status, message) => {
            console.log(status, message)
        })
})

ipcMain.on('asyncGitStatus', (event, path) => {    
    exec('cd '+path+' && git status', (err, stdout, stderr) => {
        event.reply('asyncGitStatus', {
            'err': err,
            'stdout': stdout,
            'stderr': stderr
        })
    })
})

ipcMain.on('asyncGitCommit', (event, path) => {
    commitGitFolder(path, index)
})

async function commitGitFolder (path, index) {
    const currentBranch = await getCurrentBranch(path)

    console.log(currentBranch)
    return new Promise((resolve, reject) => {

        exec('cd ' + path
            + ' && git stash push'
            + ' && git checkout ' + BRANCH_NAME 
            + ' && git stash apply'
            + ' && git add -A'
            + ' && git commit -m "ppommo #' + index + '"'
            + ' && git checkout -f ' + currentBranch
            + ' && git stash pop',
            (err, stdout, stderr) => {
                console.log(err, stdout, stderr)
            })
    })
}

async function setGitFolder(path) {
    let hasPpomoCommitBranch = await checkBranch(path);

    if (hasPpomoCommitBranch.status === false) {
        hasPpomoCommitBranch = await createBranch(path);
    }

    return new Promise((resolve, reject) => {
        if (hasPpomoCommitBranch.status === false) {
            reject(hasPpomoCommitBranch.message)
        } else {
            resolve();
        }
    })
}

async function checkBranch (path) {
    return new Promise((resolve) => {
        exec('cd ' + path + ' && git branch', (err, stdout, stderr) => {
            let branches = stdout.split('\n')
            for (let i in branches) {
                if (branches[i].indexOf(BRANCH_NAME) !== -1) {
                    resolve({
                        status: true,
                        message: stdout
                    })
                }
            }

            resolve({
                status: false,
                message: stdout 
            })
        })
    })
}

async function createBranch (path) {
    return new Promise((resolve) => {
        exec('cd ' + path + ' && git branch ' + BRANCH_NAME, (err, stdout, stderr) => {
            resolve({
                status: resolve === undefined,
                message: (resolve === undefined) ? stdout : stderr
            })
        })
    })
}

async function getBranches (path) {
    return new Promise((resolve) => {
        exec('cd ' + path + ' && git branch', (err, stdout, stderr) => {
            resolve(stdout.split('\n'))
        })
    })
}

async function getCurrentBranch (path) {
    const branches = await getBranches(path)
    let currentBranch = null;

    return new Promise((resolve) => {
        for(let i in branches) {
            if (branches[i].indexOf('*') == 0) {
                currentBranch = branches[i].replace('* ', '')
            }
        }
        if (currentBranch) {
            resolve(currentBranch);
        } else {
            reject();
        }
    })
}
// function createBranch(fo)