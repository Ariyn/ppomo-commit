const fs = require('fs')
const { ipcMain } = require('electron')

const {
    gitStatus,
    gitBranch,
    gitStash,
    gitCheckout,
    gitAddAll,
    gitCommit,
    gitBranchCreate,
    gitLog
} = require('./git_wrapper')
const { PPOMO_COMMIT_PREFIX } = require('./config')

const BRANCH_NAME = 'ppomo-commit'
let ppomoIndex = 0;

ipcMain.on('syncCheckGitInitialized', (event, folder) => {
    // is this ok? just check .git folder exists?
    // should i call git status for test?
    event.returnValue = fs.existsSync(folder + '/.git')
})

ipcMain.on('asyncSetGitFolder', async (event, path) => {
    const result = await setGitFolder(path)
    result.path = path

    if (result.err) {
        console.log(result.msg)
    } else {
        ppomoIndex = result.index
    }

    event.reply('asyncSetGitFolder', result)
})

ipcMain.on('asyncGitStatus', async (event, path) => {
    try {
        const statusString = await gitStatus(path)
        event.reply('asyncGitStatus', {
            'msg': statusString
        })
    } catch (error) {
        event.reply('asyncGitStatus', {
            'err': true,
            'msg': error
        })
    }
})

ipcMain.on('asyncGitLog', async (event, path) => {
    const logs = await gitLog(path, {branch: BRANCH_NAME})
    event.reply('asyncGitLog', logs)
})

ipcMain.on('asyncGitCommit', (event, path) => {
    // does this try~catch works?
    try {
        commitGitFolder(path, ppomoIndex)
        ppomoIndex += 1

        event.reply('asyncGitCommit', {
            'msg': 'success'
        })
    } catch (error) {
        event.reply('asyncGitCommit', {
            'err': true,
            'msg': error
        })
    }
})

async function commitGitFolder (path, index) {
    const { currentBranch } = await gitBranch(path)

    try {
        await gitStash(path, {push: true, name: '#' + index})
        await gitCheckout(path, BRANCH_NAME, {force: true})
        
        await gitStash(path, {apply: true})
        await gitAddAll(path)
        await gitCommit(path, PPOMO_COMMIT_PREFIX + index)
    
        await gitCheckout(path, currentBranch, {force: true})
        await gitStash(path, {apply: true})
    } catch (error) {
        console.log(error)
        throw error
    }
}

async function setGitFolder(path) {
    let { branches } = await gitBranch(path)

    if (!branches.includes(BRANCH_NAME)) {
        try {
            await gitBranchCreate(path, BRANCH_NAME)
        } catch (error) {
            return {
                'err': error,
                'msg': error.message
            }
        }
    }

    let newBranches = (await gitBranch(path)).branches
    if (!newBranches.includes(BRANCH_NAME)) {
        return {
            'err': true,
            'msg': 'something wrong'
        }
    }

    const ppomoIndex = await getLastPpomoIndex(path) + 1

    return {
        'status': 'success',
        'index': ppomoIndex
    }
}

async function getLastPpomoIndex (path) {
    const logs = await gitLog(path, {branch: BRANCH_NAME})
    const latestLog = logs.filter(log => log.isPpomoCommit).sort((a, b) => {a.index - b.index}).reverse()[0]

    return latestLog.index
}

module.exports = {
    getLastPpomoIndex
}