import fs from 'fs';
import git from '../GitWrapper';
import { PPOMO_COMMIT_PREFIX, BRANCH_NAME } from '../renderer/config';

const state = {
  selectedPath: '',
  ppomoIndex: 0,
};

async function getLastPpomoIndex(path) {
  const logs = await git.log(path, { branch: BRANCH_NAME });
  const latestLog = logs
    .filter(log => log.isPpomoCommit)
    .sort((a, b) => a.index - b.index)
    .reverse()[0];

  return latestLog.index;
}

async function setGitFolder(path) {
  const { branches } = await git.branch(path);

  if (!branches.includes(BRANCH_NAME)) {
    await git.branchCreate(path, BRANCH_NAME);
  }

  const newBranches = (await git.branch(path)).branches;
  if (!newBranches.includes(BRANCH_NAME)) {
    throw new Error('something wrong');
  }

  const ppomoIndex = await getLastPpomoIndex(path) + 1;
  return {
    status: 'success',
    index: ppomoIndex,
  };
}

async function commitGitFolder(path, index) {
  try {
    const { currentBranch } = await git.branch(path);
    await git.stash(path, { push: true, name: `#${index}` });
    await git.checkout(path, BRANCH_NAME, { force: true });

    await git.stash(path, { apply: true });
    await git.add(path);
    await git.commit(path, PPOMO_COMMIT_PREFIX + index);

    await git.checkout(path, currentBranch, { force: true });
    await git.stash(path, { apply: true });
  } catch (ex) {
    console.log('error', ex, ex.message, path, index);
    throw ex;
  }
}

const eventHandlers = {
  async syncCheckGitInitialized(event, path) {
    const isGitFolderExists = fs.existsSync(`${path}/.git`);
    console.log('.git folder exists', isGitFolderExists);

    if (isGitFolderExists) {
      try {
        await git.branch(path);
        event.returnValue = isGitFolderExists;
      } catch (error) {
        event.returnValue = error;
      }
    } else {
      event.returnValue = false;
    }
  },
  async asyncSetGitFolder(event, path) {
    try {
      const { index } = await setGitFolder(path);
      state.ppomoIndex = index;
      state.selectedPath = path;

      event.sender.send(this.key, { status: true });
    } catch (error) {
      console.log(error);
      event.sender.send(this.key, { error });
    }
  },
  async asyncGitCommit(event) {
    console.log('commiting', state.selectedPath);
    let branches;

    try {
      branches = await git.branch(state.selectedPath);
    } catch (error) {
      console.log('error to select branch', error);
      event.sender.send(this.key, {
        error: true,
        message: error,
      });
    }

    console.log('current branch', branches, branches.currentBranch);

    try {
      await commitGitFolder(state.selectedPath, state.ppomoIndex);
      state.ppomoIndex += 1;

      event.sender.send(this.key, {
        message: 'success',
      });
    } catch (ex) {
      console.log('error to commit', ex, ex.message);
      await git.checkout(state.selectedPath, branches.currentBranch, { force: true });

      event.sender.send(this.key, {
        error: true,
        message: ex.message,
        command: ex.command,
      });
    }
  },
  syncIsGitSelected(event) {
    event.returnValue = state.selectedPath !== '';
  },
  syncRestSelectedGitFolder(event) {
    state.selectedPath = '';
    event.returnValue = true;
  },
};

export default {
  eventHandlers,
};
