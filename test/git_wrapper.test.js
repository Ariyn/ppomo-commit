const fs = require('fs')
const {
    gitStatus, 
    gitBranch, 
    gitBranchCreate,
    gitBranchDelete,
    gitStash,
    gitCheckout,
    gitCommit,
    gitLog,
    gitAddAll,
    gitLs
} = require('../src/git_wrapper')

const PATH = 'C:\\Users\\ariyn\\Documents\\electron\\ppomo-git\\test-git\\'
const SAMPLE_BRANCH_NAME = 'SAMPLE'
const SAMPLE_COMMIT_MESSAGE = 'sample commit'

beforeEach(() => {
    createFile('SAMPLE_NEW')
    editFile('sample')
})

afterEach(async () => {
    try {
        removeFile('SAMPLE_NEW')
    } catch (error) {
        console.log("no file to remove")
    }
    restoreFile('sample')

    const { branches, currentBranch } = await gitBranch(PATH)
    if (currentBranch !== 'master') {
        console.log('current branch is not master')
        await gitCheckout(PATH, 'master', {force: true})
    }

    if (branches.includes(SAMPLE_BRANCH_NAME)) {
        console.log('sample branch is not deleted')
        await gitBranchDelete(PATH, SAMPLE_BRANCH_NAME, {force: true})
    }

    const stashes = await gitStash(PATH, {list: true})
    for(let i=0; i<stashes.length; i++) {
        await gitStash(PATH, {drop: true})
    }
})

test('get git status', async () => {
    expect(await gitStatus(PATH)).toBeDefined()
})

test('get git files', async () => {
    expect(await gitLs(PATH)).toEqual(expect.arrayContaining(['sample', 'SAMPLE_NEW']))
})

test('get git status with not exists path', async () => {
    return expect(gitStatus(PATH + '_bad_salt'))
        .rejects
        .toThrow('no such path')
})

test('get git branches', async () => {
    const { branches } = await gitBranch(PATH)
    expect(branches[0]).toBe('master')
})

test('get git current branch', async () => {
    const { currentBranch } = await gitBranch(PATH)
    expect(currentBranch).toBe('master')
})

test('get stash list', async () => {
    const stashList = await gitStash(PATH, {list:true})
    expect(stashList.length).toBe(0)
})

test('create and delete branch', async () => {
    const originalBranches = (await gitBranch(PATH)).branches

    await gitBranchCreate(PATH, SAMPLE_BRANCH_NAME)
    const addedBranches  = (await gitBranch(PATH)).branches
    expect(addedBranches).toContain(SAMPLE_BRANCH_NAME)
    expect(addedBranches.length).toBe(originalBranches.length + 1)

    await gitBranchDelete(PATH, SAMPLE_BRANCH_NAME)
    const removedBranches = (await gitBranch(PATH)).branches
    expect(removedBranches).not.toContain(SAMPLE_BRANCH_NAME)
    expect(removedBranches).toStrictEqual(originalBranches)
})

test('create branch with already existing name', async () => {
    const originalBranches = (await gitBranch(PATH)).branches
    await gitBranchCreate(PATH, SAMPLE_BRANCH_NAME)

    try {
        expect(gitBranchCreate(PATH, SAMPLE_BRANCH_NAME))
        .rejects
        .toThrow('same branch name')   
    } finally {
        await gitBranchDelete(PATH, SAMPLE_BRANCH_NAME, {force: true})
    }

    const removedBranches = (await gitBranch(PATH)).branches
    expect(removedBranches).toStrictEqual(originalBranches)
})

test('get stash push and pop', async () => {
    const prevStashes = await gitStash(PATH, {list: true})

    await gitStash(PATH, {push: true})
    const currStashes = await gitStash(PATH, {list: true}) 
    expect(currStashes.length).toBe(prevStashes.length + 1)

    await gitStash(PATH, {pop: true})
    const newStashes = await gitStash(PATH, {list: true})
    expect(newStashes.length).toBe(prevStashes.length)
})

test('checkout to other branch', async () => {
    const prevBranch = await gitBranch(PATH)
    await gitBranchCreate(PATH, SAMPLE_BRANCH_NAME)

    await gitCheckout(PATH, SAMPLE_BRANCH_NAME, {force: true})
    expect((await gitBranch(PATH)).currentBranch).not.toBe(prevBranch.currentBranch)

    await gitCheckout(PATH, prevBranch.currentBranch, {force: true})
    expect((await gitBranch(PATH)).currentBranch).toBe(prevBranch.currentBranch)

    await gitBranchDelete(PATH, SAMPLE_BRANCH_NAME, {force: true})
    expect((await gitBranch(PATH)).branches).toStrictEqual(prevBranch.branches)
})

test('commit to sample branch', async () => {
    const oldBranchState = await gitBranch(PATH)
    const oldFiles = await gitLs(PATH)

    await gitBranchCreate(PATH, SAMPLE_BRANCH_NAME)
    await gitStash(PATH, {push: true})
    await gitCheckout(PATH, SAMPLE_BRANCH_NAME, {force: true})
    await gitStash(PATH, {apply: true})
    await gitAddAll(PATH)
    await gitCommit(PATH, SAMPLE_COMMIT_MESSAGE)

    const logs = await gitLog(PATH)
    expect(logs[0].message).toBe(SAMPLE_COMMIT_MESSAGE)

    await gitCheckout(PATH, oldBranchState.currentBranch, {force: true})
    await gitStash(PATH, {apply: true})
    await gitBranchDelete(PATH, SAMPLE_BRANCH_NAME, {force: true})

    const newBranchState = await gitBranch(PATH)
    const newFiles = await gitLs(PATH)

    expect(newFiles).toStrictEqual(oldFiles)
    expect(newBranchState.currentBranch).toBe(oldBranchState.currentBranch)
    expect(newBranchState.branches).toStrictEqual(oldBranchState.branches)
})

function createFile (name) {
    const filePath = PATH + '/' + name
    fs.writeFileSync(filePath, 'new_data' + (Math.random() * 10000))
}

function removeFile (name) {
    const filePath = PATH + '/' + name
    fs.unlinkSync(filePath)
}

function editFile (name) {
    const filePath = PATH + '/' + name
    const originalData = fs.readFileSync(filePath)

    fs.writeFileSync(filePath, originalData + 'new_data' + (Math.random() * 10000))
}

function restoreFile (name) {
    const filePath = PATH + '/' + name
    fs.writeFileSync(filePath, '')
}