import { setLayerFullColor } from './setLayerFullColor';

const mockBeginUndoableChange = jest.fn();
const mockFinishUndoableChange = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
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

jest.mock(
  '@core/helpers/color/updateLayerColor',
  () =>
    (...args) =>
      mockUpdateLayerColor(...args),
);

describe('test setLayerFullColor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should work when set to true', () => {
    const layer = document.createElement('g');
    const mockCmd = { onAfter: jest.fn() };

    mockFinishUndoableChange.mockReturnValue(mockCmd);

    const cmd = setLayerFullColor(layer, true);

    expect(cmd).toBe(mockCmd);
    expect(mockBeginUndoableChange).toHaveBeenCalledWith('data-fullcolor', [layer]);
    expect(mockFinishUndoableChange).toHaveBeenCalled();
    expect(mockUpdateLayerColor).toHaveBeenCalledWith(layer);
  });

  it('should work when set to false', () => {
    const layer = document.createElement('g');

    layer.setAttribute('data-fullcolor', '1');

    const mockCmd = { onAfter: jest.fn() };

    mockFinishUndoableChange.mockReturnValue(mockCmd);

    const cmd = setLayerFullColor(layer, false);

    expect(cmd).toBe(mockCmd);
    expect(mockBeginUndoableChange).toHaveBeenCalledWith('data-fullcolor', [layer]);
    expect(mockFinishUndoableChange).toHaveBeenCalled();
    expect(mockUpdateLayerColor).toHaveBeenCalledWith(layer);
  });

  it('should work without val', () => {
    const layer = document.createElement('g');

    layer.setAttribute('data-fullcolor', '1');

    const mockCmd = { onAfter: jest.fn() };

    mockFinishUndoableChange.mockReturnValue(mockCmd);

    const cmd = setLayerFullColor(layer);

    expect(cmd).toBe(mockCmd);
    expect(mockBeginUndoableChange).toHaveBeenCalledWith('data-fullcolor', [layer]);
    expect(mockFinishUndoableChange).toHaveBeenCalled();
    expect(mockUpdateLayerColor).toHaveBeenCalledWith(layer);
    expect(layer.getAttribute('data-fullcolor')).toBeNull();
  });

  it('should return null when val is same as original', () => {
    const layer = document.createElement('g');

    layer.setAttribute('data-fullcolor', '1');

    const cmd = setLayerFullColor(layer, true);

    expect(cmd).toBeNull();
    expect(mockUpdateLayerColor).not.toHaveBeenCalled();
  });
});
