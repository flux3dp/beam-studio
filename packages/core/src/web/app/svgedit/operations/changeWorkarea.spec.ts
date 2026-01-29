const mockBatchCommand = jest.fn();

jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: function (...args: unknown[]) {
    return mockBatchCommand(...args);
  },
}));

let batchCmd: { addSubCommand: jest.Mock; onAfter: (() => void) | undefined };

import changeWorkarea from './changeWorkarea';

const mockToggleFullColorAfterWorkareaChange = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  toggleFullColorAfterWorkareaChange: (...args: unknown[]) => mockToggleFullColorAfterWorkareaChange(...args),
}));

const mockChangeDocumentStoreValue = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  changeDocumentStoreValue: (...args: unknown[]) => mockChangeDocumentStoreValue(...args),
}));

const mockRegulateAllLayersDpi = jest.fn();

jest.mock('@core/helpers/layer/regulateAllLayersDpi', () => ({
  regulateAllLayersDpi: (...args: unknown[]) => mockRegulateAllLayersDpi(...args),
}));

describe('test changeWorkarea', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    batchCmd = { addSubCommand: jest.fn(), onAfter: undefined };
    mockBatchCommand.mockReturnValue(batchCmd);
  });

  it('should work correctly', () => {
    const mockCmd = { onAfter: () => {} };

    mockChangeDocumentStoreValue.mockReturnValue(mockCmd);
    expect(batchCmd.addSubCommand).toHaveBeenCalledTimes(0);
    changeWorkarea('fbm1');

    expect(mockChangeDocumentStoreValue).toHaveBeenCalledTimes(1);
    expect(mockChangeDocumentStoreValue).toHaveBeenLastCalledWith('workarea', 'fbm1');
    expect(batchCmd.addSubCommand).toHaveBeenCalledTimes(1);
    expect(batchCmd.addSubCommand).toHaveBeenLastCalledWith(mockCmd);
    expect(mockRegulateAllLayersDpi).toHaveBeenCalledTimes(1);
    expect(mockRegulateAllLayersDpi).toHaveBeenLastCalledWith('fbm1', { parentCmd: batchCmd });
    expect(mockToggleFullColorAfterWorkareaChange).toHaveBeenCalledTimes(1);

    jest.resetAllMocks();
    batchCmd.onAfter?.();
    expect(mockToggleFullColorAfterWorkareaChange).toHaveBeenCalledTimes(1);
  });

  it('should work correctly with toggleModule = false', () => {
    const mockCmd = { onAfter: () => {} };

    mockChangeDocumentStoreValue.mockReturnValue(mockCmd);
    changeWorkarea('fbm1', { toggleModule: false });
    expect(mockChangeDocumentStoreValue).toHaveBeenCalledTimes(1);
    expect(mockChangeDocumentStoreValue).toHaveBeenLastCalledWith('workarea', 'fbm1');
    expect(mockRegulateAllLayersDpi).toHaveBeenCalledTimes(1);
    expect(mockRegulateAllLayersDpi).toHaveBeenLastCalledWith('fbm1', { parentCmd: batchCmd });
    expect(mockToggleFullColorAfterWorkareaChange).not.toHaveBeenCalled();

    jest.resetAllMocks();
    batchCmd.onAfter?.();
    expect(mockToggleFullColorAfterWorkareaChange).not.toHaveBeenCalled();
  });
});
