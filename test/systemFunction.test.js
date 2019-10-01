const { getLastPpomoIndex } = require('../src/systemFunctions');

jest.mock('electron', () => ({
  ipcMain: {
    on: jest.fn(),
  },
}));

const PATH = 'C:\\Users\\ariyn\\Documents\\electron\\ppomo-git\\test-git\\';
test('get last committed ppomo index from log', async () => {
  await getLastPpomoIndex(PATH);
});
