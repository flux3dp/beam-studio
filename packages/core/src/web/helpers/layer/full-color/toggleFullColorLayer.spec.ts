const mockBatchCommand = jest.fn();

jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: mockBatchCommand,
}));

import toggleFullColorLayer from './toggleFullColorLayer';

const mockUpdateLayerColor = jest.fn();

jest.mock(
  '@core/helpers/color/updateLayerColor',
  () =>
    (...args) =>
      mockUpdateLayerColor(...args),
);

const mockGetData = jest.fn();
const mockWriteDataLayer = jest.fn();

jest.mock('../layer-config-helper', () => ({
  getData: (...args) => mockGetData(...args),
  writeDataLayer: (...args) => mockWriteDataLayer(...args),
}));

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
}));

const mockCmd: any = { onAfter: jest.fn() };

describe('test toggleFullColorLayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetData.mockReturnValue(false);
    global.console.log = jest.fn();

    mockBatchCommand.mockImplementation((id) => {
      mockCmd.id = id;

      return mockCmd;
    });
  });

  it('should work when set to true', () => {
    const layer = document.createElement('g');
    const cmd = toggleFullColorLayer(layer, { val: true });

    expect(cmd).toBe(mockCmd);
    expect(mockGetData).toHaveBeenCalledTimes(1);
    expect(mockGetData).toHaveBeenLastCalledWith(layer, 'fullcolor');
    expect(mockWriteDataLayer).toHaveBeenCalledTimes(1);
    expect(mockWriteDataLayer).toHaveBeenLastCalledWith(layer, 'fullcolor', true, { batchCmd: mockCmd });
    expect(mockUpdateLayerColor).toHaveBeenCalledWith(layer);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenLastCalledWith(mockCmd);
  });

  it('should work when set to false', () => {
    mockGetData.mockReturnValue(true);

    const layer = document.createElement('g');
    const cmd = toggleFullColorLayer(layer, { val: false });

    expect(cmd).toBe(mockCmd);
    expect(mockGetData).toHaveBeenCalledTimes(1);
    expect(mockGetData).toHaveBeenLastCalledWith(layer, 'fullcolor');
    expect(mockWriteDataLayer).toHaveBeenCalledTimes(1);
    expect(mockWriteDataLayer).toHaveBeenLastCalledWith(layer, 'fullcolor', false, { batchCmd: mockCmd });
    expect(mockUpdateLayerColor).toHaveBeenCalledWith(layer);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenLastCalledWith(mockCmd);
  });

  it('should work without val', () => {
    mockGetData.mockReturnValue(true);

    const layer = document.createElement('g');
    const cmd = toggleFullColorLayer(layer);

    expect(cmd).toBe(mockCmd);
    expect(mockGetData).toHaveBeenCalledTimes(1);
    expect(mockGetData).toHaveBeenLastCalledWith(layer, 'fullcolor');
    expect(mockWriteDataLayer).toHaveBeenCalledTimes(1);
    expect(mockWriteDataLayer).toHaveBeenLastCalledWith(layer, 'fullcolor', false, { batchCmd: mockCmd });
    expect(mockUpdateLayerColor).toHaveBeenCalledWith(layer);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenLastCalledWith(mockCmd);
  });

  it('should return null when val is same as original', () => {
    mockGetData.mockReturnValue(true);

    const layer = document.createElement('g');
    const cmd = toggleFullColorLayer(layer, { val: true });

    expect(cmd).toBeNull();
    expect(mockUpdateLayerColor).not.toHaveBeenCalled();
  });
});
