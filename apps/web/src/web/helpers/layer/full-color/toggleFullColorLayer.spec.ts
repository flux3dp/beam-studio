import toggleFullColorLayer from './toggleFullColorLayer';

const mockBeginUndoableChange = jest.fn();
const mockFinishUndoableChange = jest.fn();
jest.mock('helpers/svg-editor-helper', () => ({
  getSVGAsync: (cb) => {
    cb({
      Canvas: {
        undoMgr: {
          beginUndoableChange: (...args) => mockBeginUndoableChange(...args),
          finishUndoableChange: (...args) => mockFinishUndoableChange(...args),
        },
      },
    });
  },
}));

const mockUpdateLayerColor = jest.fn();
jest.mock('helpers/color/updateLayerColor', () => (...args) => mockUpdateLayerColor(...args));

describe('test toggleFullColorLayer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should work when set to true', () => {
    const layer = document.createElement('g');
    const mockCmd = { onAfter: jest.fn() };
    mockFinishUndoableChange.mockReturnValue(mockCmd);
    const cmd = toggleFullColorLayer(layer, { val: true });
    expect(cmd).toBe(mockCmd);
    expect(mockBeginUndoableChange).toBeCalledWith('data-fullcolor', [layer]);
    expect(mockFinishUndoableChange).toBeCalled();
    expect(mockUpdateLayerColor).toBeCalledWith(layer);
  });

  it('should work when set to false', () => {
    const layer = document.createElement('g');
    layer.setAttribute('data-fullcolor', '1');
    const mockCmd = { onAfter: jest.fn() };
    mockFinishUndoableChange.mockReturnValue(mockCmd);
    const cmd = toggleFullColorLayer(layer, { val: false });
    expect(cmd).toBe(mockCmd);
    expect(mockBeginUndoableChange).toBeCalledWith('data-fullcolor', [layer]);
    expect(mockFinishUndoableChange).toBeCalled();
    expect(mockUpdateLayerColor).toBeCalledWith(layer);
  });

  it('should work without val', () => {
    const layer = document.createElement('g');
    layer.setAttribute('data-fullcolor', '1');
    const mockCmd = { onAfter: jest.fn() };
    mockFinishUndoableChange.mockReturnValue(mockCmd);
    const cmd = toggleFullColorLayer(layer);
    expect(cmd).toBe(mockCmd);
    expect(mockBeginUndoableChange).toBeCalledWith('data-fullcolor', [layer]);
    expect(mockFinishUndoableChange).toBeCalled();
    expect(mockUpdateLayerColor).toBeCalledWith(layer);
    expect(layer.getAttribute('data-fullcolor')).toBeNull();
  });

  it('should return null when val is same as original', () => {
    const layer = document.createElement('g');
    layer.setAttribute('data-fullcolor', '1');
    const cmd = toggleFullColorLayer(layer, { val: true });
    expect(cmd).toBeNull();
    expect(mockUpdateLayerColor).not.toBeCalled();
  });
});
