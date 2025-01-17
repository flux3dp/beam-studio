import openFileHelper from './open-file-helper';

const mockSendSync = jest.fn();
jest.mock('implementations/communicator', () => ({
  sendSync: (...args) => mockSendSync(...args),
}));

const mockHandleFile = jest.fn();
jest.mock('helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) => (callback({
    Editor: {
      handleFile: (...args) => mockHandleFile(...args),
    },
  })),
}));

const mockFetch = jest.fn();
describe('test openFileHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.fetch = mockFetch;
  });

  it('should do nothing if no path returned', async () => {
    mockSendSync.mockReturnValue('');
    await openFileHelper.loadOpenFile();
    expect(mockSendSync).toBeCalledTimes(1);
    expect(mockSendSync).toHaveBeenLastCalledWith('GET_OPEN_FILE');
    expect(mockFetch).not.toBeCalled();
    expect(mockHandleFile).not.toBeCalled();
  });

  it('should work', async () => {
    mockSendSync.mockReturnValue('mock-path');
    const mockResp = {
      blob: jest.fn(),
    };
    mockFetch.mockResolvedValue(mockResp);
    mockResp.blob.mockResolvedValue('mock-blob');
    await openFileHelper.loadOpenFile();
    expect(mockSendSync).toBeCalledTimes(1);
    expect(mockSendSync).toHaveBeenLastCalledWith('GET_OPEN_FILE');
    expect(mockFetch).toBeCalledTimes(1);
    expect(mockFetch).toHaveBeenLastCalledWith('mock-path');
    expect(mockResp.blob).toBeCalledTimes(1);
    expect(mockHandleFile).toBeCalledTimes(1);
  });
});
