import changeWorkarea from './changeWorkarea';

const mockToggleFullColorAfterWorkareaChange = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  toggleFullColorAfterWorkareaChange: (...args) => mockToggleFullColorAfterWorkareaChange(...args),
}));

const mockGetState = jest.fn();
const mockChangeMultipleDocumentStoreValues = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  changeMultipleDocumentStoreValues: (...args) => mockChangeMultipleDocumentStoreValues(...args),
  useDocumentStore: {
    getState: (...args) => mockGetState(...args),
  },
}));

const mockRegulateEngraveDpiOption = jest.fn();

jest.mock('@core/helpers/regulateEngraveDpi', () => ({
  regulateEngraveDpiOption: (...args) => mockRegulateEngraveDpiOption(...args),
}));

describe('test changeWorkarea', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetState.mockReturnValue({
      engrave_dpi: 'original-dpi',
    });
    mockRegulateEngraveDpiOption.mockReturnValue('regulated-dpi');
  });

  it('should work correctly', () => {
    const mockCmd = { onAfter: () => {} };

    mockChangeMultipleDocumentStoreValues.mockReturnValue(mockCmd);
    changeWorkarea('fbm1');
    expect(mockRegulateEngraveDpiOption).toHaveBeenCalledTimes(1);
    expect(mockRegulateEngraveDpiOption).toHaveBeenLastCalledWith('fbm1', 'original-dpi');
    expect(mockChangeMultipleDocumentStoreValues).toHaveBeenCalledTimes(1);
    expect(mockChangeMultipleDocumentStoreValues).toHaveBeenLastCalledWith({
      engrave_dpi: 'regulated-dpi',
      workarea: 'fbm1',
    });
    expect(mockToggleFullColorAfterWorkareaChange).toHaveBeenCalledTimes(1);

    const { onAfter } = mockCmd;

    jest.resetAllMocks();
    onAfter();
    expect(mockToggleFullColorAfterWorkareaChange).toHaveBeenCalledTimes(1);
  });

  it('should work correctly with toggleModule = false', () => {
    const mockCmd = { onAfter: () => {} };

    mockChangeMultipleDocumentStoreValues.mockReturnValue(mockCmd);
    changeWorkarea('fbm1', { toggleModule: false });
    expect(mockRegulateEngraveDpiOption).toHaveBeenCalledTimes(1);
    expect(mockRegulateEngraveDpiOption).toHaveBeenLastCalledWith('fbm1', 'original-dpi');
    expect(mockChangeMultipleDocumentStoreValues).toHaveBeenCalledTimes(1);
    expect(mockChangeMultipleDocumentStoreValues).toHaveBeenLastCalledWith({
      engrave_dpi: 'regulated-dpi',
      workarea: 'fbm1',
    });
    expect(mockToggleFullColorAfterWorkareaChange).not.toHaveBeenCalled();

    const { onAfter } = mockCmd;

    jest.resetAllMocks();
    onAfter();
    expect(mockToggleFullColorAfterWorkareaChange).not.toHaveBeenCalled();
  });
});
