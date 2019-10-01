const { exec } = require('child_process');
const iconv = require('iconv-lite');
const { PPOMO_STASH_PREFIX, PPOMO_COMMIT_PREFIX } = require('./config');

function get_cd_command(path) {
  return `cd ${path} `;
}

async function command(path, command) {
  const cd_command = get_cd_command(path);

  return new Promise((resolve, reject) => {
    exec(`${cd_command} && ${command}`, { encoding: 'buffer' }, (err, stdout, stderr) => {
      if (err) {
        const encodedStderr = iconv.decode(stderr, 'euc-kr').replace('\n', '');

        if (encodedStderr.indexOf('지정된 경로를 찾을 수 없습니다.') !== -1) {
          reject(new Error('no such path'));
        } else if (encodedStderr.match('fatal: A branch named \'(.+?)\' already exists.')) {
          reject(new Error('same branch name'));
        }

        // console.log("failed " + iconv.decode(stderr, 'utf-8'))
        reject(iconv.decode(stderr, 'utf-8'));
      }

      resolve(iconv.decode(stdout, 'utf-8'));
    });
  });
}

async function gitStatus(path) {
  return command(path, 'git status');
}

async function gitBranch(path) {
  const branches = (await command(path, 'git branch')).split('\n').map(branch => branch.trim()).filter(branch => branch.length != 0);
  const currentBranchIndex = branches.findIndex(branch => branch.indexOf('* ') == 0);
  const currentBranch = branches[currentBranchIndex] = branches[currentBranchIndex].replace('* ', '');

  return {
    branches,
    currentBranch,
  };
}

async function gitBranchCreate(path, name) {
  return command(path, `git branch ${name}`);
}

async function gitBranchDelete(path, name, options = {}) {
  const force = options.force ? '-D ' : '-d ';
  return command(path, `git branch ${force}${name}`);
}

async function gitStash(path, options = {}) {
  let option = '';

  if (options.push) {
    option = ` push -a -m ${PPOMO_STASH_PREFIX}${options.name ? options.name : ''}`;
  } else if (options.apply) {
    option = ' apply';
  } else if (options.pop) {
    option = ' pop';
  } else if (options.list) {
    option = ' list';
  } else if (options.drop) {
    option = ' drop';
    if (options.index) {
      option += ` ${options.index}`;
      // } else if (options.name) {
      //     options += ' '
    }
  }

  const cmd = `git stash${option}`;

  if (options.list) {
    const stashes = (await command(path, cmd)).split('\n').map(stash => stash.trim()).filter(stash => stash.length != 0);
    return collectStashes(stashes);
  }
  return command(path, cmd);
}

function collectStashes(stashList) {
  // stash@{0}: WIP on master: 2a0c431 init commit
  const newStashList = [];

  for (const i in stashList) {
    const datas = stashList[i].split(':');

    const stashIndex = parseInt(datas[0].trim().replace('stash@{', '').replace());
    const stashOriginalBranch = datas[1].trim().replace('WIP on ');
    const message = datas[2];
    const isPpomoStash = message.startsWith(PPOMO_STASH_PREFIX);

    newStashList.push({
      index: stashIndex,
      branch: stashOriginalBranch,
      message,
      isPpomoStash,
    });
  }

  return newStashList;
}

async function gitCheckout(path, branchName, options = {}) {
  const option = options.force ? '-f ' : '';

  const cmd = `git checkout ${option}${branchName}`;
  return command(path, cmd);
}

async function gitAddAll(path) {
  return command(path, 'git add -A');
}

async function gitCommit(path, message) {
  return command(path, `git commit -m "${message}"`);
}

async function gitLog(path, options = {}) {
  let branch = '';

  if (options.branch) {
    branch = ` ${options.branch}`;
  }

  const logs = (await command(path, `git log --pretty=format:"%h%x09%ad%x09%s" --date=iso${branch}`)).split('\n').map(log => log.trim()).filter(log => log.length != 0);
  const newLogs = [];

  for (const i in logs) {
    const logDetails = logs[i].trim().split('\t');
    const isPpomoCommit = logDetails[2].startsWith(PPOMO_COMMIT_PREFIX);
    let index;

    if (isPpomoCommit) {
      index = parseInt(logDetails[2].replace(PPOMO_COMMIT_PREFIX, ''));
    }

    newLogs.push({
      hash: logDetails[0],
      date: logDetails[1],
      message: logDetails[2],
      isPpomoCommit,
      index,
    });
  }

  return newLogs;
}

async function gitLs(path) {
  return (await command(path, 'git ls-files -mo')).split('\n').map(log => log.trim()).filter(log => log.length != 0);
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
  gitLs,
};
