import changeWorkarea from './changeWorkarea';

const mockToggleFullColorAfterWorkareaChange = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  toggleFullColorAfterWorkareaChange: (...args) => mockToggleFullColorAfterWorkareaChange(...args),
}));

const mockChangeDocumentStoreValue = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  changeDocumentStoreValue: (...args) => mockChangeDocumentStoreValue(...args),
}));

describe('test changeWorkarea', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should work correctly', () => {
    const mockCmd = { onAfter: () => {} };

    mockChangeDocumentStoreValue.mockReturnValue(mockCmd);
    changeWorkarea('fbm1');
    expect(mockChangeDocumentStoreValue).toHaveBeenCalledTimes(1);
    expect(mockChangeDocumentStoreValue).toHaveBeenLastCalledWith('workarea', 'fbm1');
    expect(mockToggleFullColorAfterWorkareaChange).toHaveBeenCalledTimes(1);

    const { onAfter } = mockCmd;

    jest.resetAllMocks();
    onAfter();
    expect(mockToggleFullColorAfterWorkareaChange).toHaveBeenCalledTimes(1);
  });

  it('should work correctly with toggleModule = false', () => {
    const mockCmd = { onAfter: () => {} };

    mockChangeDocumentStoreValue.mockReturnValue(mockCmd);
    changeWorkarea('fbm1', { toggleModule: false });
    expect(mockChangeDocumentStoreValue).toHaveBeenCalledTimes(1);
    expect(mockChangeDocumentStoreValue).toHaveBeenLastCalledWith('workarea', 'fbm1');
    expect(mockToggleFullColorAfterWorkareaChange).not.toBeCalled();

    const { onAfter } = mockCmd;

    jest.resetAllMocks();
    onAfter();
    expect(mockToggleFullColorAfterWorkareaChange).not.toBeCalled();
  });
});
