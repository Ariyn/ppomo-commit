const { exec } = require('child_process')
const iconv = require('iconv-lite')

function get_cd_command (path) {
    return 'cd ' + path + ' '
}

async function command (path, command) {
    const cd_command = get_cd_command(path)

    return new Promise((resolve, reject) => {
        exec(cd_command + ' && ' + command, {encoding:'buffer'}, (err, stdout, stderr) => {
            if (err) {
                const encodedStderr = iconv.decode(stderr, 'euc-kr').replace('\n', '')
                
                if (encodedStderr.indexOf('지정된 경로를 찾을 수 없습니다.') !== -1) {
                    reject(new Error('no such path'))
                } else if(encodedStderr.match('fatal: A branch named \'(.+?)\' already exists.')) {
                    reject(new Error('same branch name'))
                }
                
                // console.log("failed " + iconv.decode(stderr, 'utf-8'))
                reject(iconv.decode(stderr, 'utf-8'))
            }

            resolve(iconv.decode(stdout, 'utf-8'))
        })
    })
}

async function gitStatus(path) {
    return command(path, 'git status')
}

async function gitBranch (path) {
    let branches = (await command(path, 'git branch')).split('\n')
    let currentBranch = null

    let newBranches = []
    for (let i in branches) {
        branches[i] = branches[i].trim()
        if (branches[i].length == 0) {
            continue
        }

        if (branches[i].indexOf('* ') == 0) {
            branches[i] = branches[i].replace('* ', '')
            currentBranch = branches[i]
        }

        newBranches.push(branches[i])
    }

    return {
        'branches': newBranches,
        'currentBranch': currentBranch
    }
}

async function gitBranchCreate (path, name) {
    return command(path, 'git branch ' + name)
}

async function gitBranchDelete (path, name, options ={}) {
    let force = options.force ? '-D ' : '-d '
    return command(path, 'git branch ' + force + name)
}

async function gitStash (path, options ={}) {
    let option = ''

    if (options.push) {
        option = ' push -a' + (options.name ? ' -m ' + options.name : '')
    } else if (options.apply) {
        option = ' apply'
    } else if (options.pop) {
        option = ' pop'
    } else if (options.list) {
        option = ' list'
    } else if (options.drop) {
        option = ' drop'
        if (options.index) {
            option += ' ' + options.index
        // } else if (options.name) {
        //     options += ' ' 
        }
    }

    const cmd = 'git stash' + option

    if (options.list) {
        let stashes = (await command(path, cmd)).split('\n')
        let newStashes = []

        for (let i in stashes) {
            stashes[i] = stashes[i].trim()
            if (stashes[i].length == 0) {
                continue
            }

            newStashes.push(stashes[i])
        }

        return newStashes
    } else {
        return command(path, cmd)
    }
}

async function gitCheckout (path, branchName, options ={}) {
    let option = options.force ? '-f ' : ''
    
    const cmd = 'git checkout ' + option + branchName
    return command(path, cmd)
}

async function gitAddAll (path) {
    return command(path, 'git add -A')
} 

async function gitCommit (path, message) {
    return command(path, 'git commit -m "' + message + '"')
}

async function gitLog (path, options ={}) {
    let branch = ''

    if (options.branch) {
        branch = ' ' + options.branch
    }

    // TODO: make split option to command function
    const logs = (await command(path, 'git log --oneline' + branch)).split('\n')
    let newLogs = []

    for (let i in logs) {
        if (logs[i].trim().length == 0) {
            continue
        }
        const logDetails = logs[i].trim().split(' ')
        newLogs.push({
            'hash': logDetails[0],
            'message': logDetails.slice(1, logDetails.length).join(' ')
        })
    }

    return newLogs
}

async function gitLs (path) {
    const files = (await command(path, 'git ls-files -mo')).split('\n')
    let newFiles = []

    for (let i in files) {
        if (files[i].length == 0) {
            continue
        }
        newFiles.push(files[i])
    }

    return newFiles
}

module.exports = {
    gitStatus,
    gitBranch,
    gitBranchCreate,
    gitBranchDelete,
    gitStash,
    gitCheckout,
    gitAddAll,
    gitCommit,
    gitLog,
    gitLs
}