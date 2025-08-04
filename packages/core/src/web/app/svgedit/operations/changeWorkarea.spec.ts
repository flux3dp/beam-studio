import changeWorkarea from './changeWorkarea';

const mockSetWorkarea = jest.fn();
const mockResetView = jest.fn();

jest.mock('@core/app/svgedit/workarea', () => ({
  resetView: (...args) => mockResetView(...args),
  setWorkarea: (...args) => mockSetWorkarea(...args),
}));

const mockToggleFullColorAfterWorkareaChange = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  toggleFullColorAfterWorkareaChange: (...args) => mockToggleFullColorAfterWorkareaChange(...args),
}));

const mockChangeDocumentStoreValue = jest.fn();
const mockGetState = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  changeDocumentStoreValue: (...args) => mockChangeDocumentStoreValue(...args),
  useDocumentStore: {
    getState: () => mockGetState(),
  },
}));

describe('test changeWorkarea', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetState.mockReturnValue({ workarea: 'fbm1' });
  });

  it('should work correctly', () => {
    const mockCmd = { onAfter: () => {} };

    mockChangeDocumentStoreValue.mockReturnValue(mockCmd);
    changeWorkarea('fbm1');
    expect(mockGetState).toHaveBeenCalledTimes(1);
    expect(mockChangeDocumentStoreValue).toHaveBeenCalledTimes(1);
    expect(mockChangeDocumentStoreValue).toHaveBeenLastCalledWith('workarea', 'fbm1');
    expect(mockSetWorkarea).toHaveBeenCalledTimes(1);
    expect(mockSetWorkarea).toHaveBeenLastCalledWith('fbm1');
    expect(mockResetView).toHaveBeenCalledTimes(1);
    expect(mockToggleFullColorAfterWorkareaChange).toHaveBeenCalledTimes(1);

    const { onAfter } = mockCmd;

    jest.resetAllMocks();
    mockGetState.mockReturnValue({ workarea: 'ado1' });
    onAfter();
    expect(mockGetState).toHaveBeenCalledTimes(1);
    expect(mockSetWorkarea).toHaveBeenCalledTimes(1);
    expect(mockSetWorkarea).toHaveBeenLastCalledWith('ado1');
    expect(mockResetView).toHaveBeenCalledTimes(1);
    expect(mockToggleFullColorAfterWorkareaChange).toHaveBeenCalledTimes(1);
  });

  it('should work correctly with toggleModule = false', () => {
    const mockCmd = { onAfter: () => {} };

    mockChangeDocumentStoreValue.mockReturnValue(mockCmd);
    changeWorkarea('fbm1', { toggleModule: false });
    expect(mockGetState).toHaveBeenCalledTimes(1);
    expect(mockChangeDocumentStoreValue).toHaveBeenCalledTimes(1);
    expect(mockChangeDocumentStoreValue).toHaveBeenLastCalledWith('workarea', 'fbm1');
    expect(mockSetWorkarea).toHaveBeenCalledTimes(1);
    expect(mockSetWorkarea).toHaveBeenLastCalledWith('fbm1');
    expect(mockResetView).toHaveBeenCalledTimes(1);
    expect(mockToggleFullColorAfterWorkareaChange).not.toBeCalled();

    const { onAfter } = mockCmd;

    jest.resetAllMocks();
    mockGetState.mockReturnValue({ workarea: 'ado1' });
    onAfter();
    expect(mockGetState).toHaveBeenCalledTimes(1);
    expect(mockSetWorkarea).toHaveBeenCalledTimes(1);
    expect(mockSetWorkarea).toHaveBeenLastCalledWith('ado1');
    expect(mockResetView).toHaveBeenCalledTimes(1);
    expect(mockToggleFullColorAfterWorkareaChange).not.toBeCalled();
  });
});
