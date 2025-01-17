/* eslint-disable import/first */
import viewMenu from './view';

const mockRead = jest.fn();
const mockWrite = jest.fn();
jest.mock('app/actions/beambox/beambox-preference', () => ({
  read: (...args) => mockRead(...args),
  write: (...args) => mockWrite(...args),
}));

const resetView = jest.fn();
jest.mock('app/svgedit/workarea', () => ({
  resetView: (...args) => resetView(...args),
}));

jest.mock('helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) => {
    callback({
      Canvas: {
        isUsingLayerColor: false,
      },
      Editor: {
        curConfig: {
          showGrid: true,
        },
      },
    });
  },
}));

const updateLayerColor = jest.fn();
jest.mock('helpers/color/updateLayerColor', () => (...args) => updateLayerColor(...args));

const mockToggleGrids = jest.fn();
jest.mock('app/actions/canvas/grid', () => ({
  toggleGrids: () => mockToggleGrids(),
}));

const mockCreateEventEmitter = jest.fn();
jest.mock('helpers/eventEmitterFactory', () => ({
  createEventEmitter: (...args) => mockCreateEventEmitter(...args),
}));
const mockEventEmitter = {
  emit: jest.fn(),
};

describe('test view', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('test updateAntiAliasing', () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    test('svg content is existing', () => {
      document.body.innerHTML = '<div id="svgcontent" />';
      viewMenu.updateAntiAliasing(false);
      expect(document.body.innerHTML).toBe('<div id="svgcontent" style="shape-rendering: optimizeSpeed;"></div>');
      viewMenu.updateAntiAliasing(true);
      expect(document.body.innerHTML).toBe('<div id="svgcontent" style=""></div>');
    });

    test('svg content does not exist', () => {
      document.body.innerHTML = '<div id="abcde" />';
      viewMenu.updateAntiAliasing(true);
      expect(document.body.innerHTML).toBe('<div id="abcde"></div>');
    });
  });

  test('test toggleLayerColor', () => {
    document.body.innerHTML = '<g class="layer" /><g class="layer" />';
    const result = viewMenu.toggleLayerColor();
    expect(mockWrite).toHaveBeenCalledTimes(1);
    expect(mockWrite).toHaveBeenNthCalledWith(1, 'use_layer_color', true);
    expect(updateLayerColor).toHaveBeenCalledTimes(2);
    expect(result).toBeTruthy();
  });

  test('test toggleGrid', () => {
    mockRead.mockReturnValue(true);
    const result = viewMenu.toggleGrid();
    expect(mockToggleGrids).toBeCalledTimes(1);
    expect(mockRead).toBeCalledTimes(1);
    expect(mockWrite).toBeCalledTimes(1);
    expect(mockWrite).toHaveBeenNthCalledWith(1, 'show_grids', false);
    expect(result).toBeFalsy();
  });

  describe('test toggleRulers', () => {
    beforeEach(() => {
      mockCreateEventEmitter.mockReturnValue(mockEventEmitter);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    test('default is false', () => {
      mockRead.mockReturnValue(false);
      const result = viewMenu.toggleRulers();
      expect(mockCreateEventEmitter).toBeCalledTimes(1);
      expect(mockCreateEventEmitter).toHaveBeenLastCalledWith('canvas');
      expect(mockEventEmitter.emit).toBeCalledTimes(1);
      expect(mockEventEmitter.emit).toHaveBeenLastCalledWith('update-ruler');
      expect(mockWrite).toHaveBeenCalledTimes(1);
      expect(mockWrite).toHaveBeenNthCalledWith(1, 'show_rulers', true);
      expect(result).toBeTruthy();
    });

    test('default is true', () => {
      mockRead.mockReturnValue(true);
      const result = viewMenu.toggleRulers();
      expect(mockCreateEventEmitter).toBeCalledTimes(1);
      expect(mockCreateEventEmitter).toHaveBeenLastCalledWith('canvas');
      expect(mockEventEmitter.emit).toBeCalledTimes(1);
      expect(mockEventEmitter.emit).toHaveBeenLastCalledWith('update-ruler');
      expect(mockWrite).toHaveBeenCalledTimes(1);
      expect(mockWrite).toHaveBeenNthCalledWith(1, 'show_rulers', false);
      expect(result).toBeFalsy();
    });
  });

  describe('test toggleZoomWithWindow', () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    test('default is false', () => {
      const addEventListener = jest.spyOn(window, 'addEventListener');
      const removeEventListener = jest.spyOn(window, 'removeEventListener');
      const result = viewMenu.toggleZoomWithWindow();
      expect(resetView).toHaveBeenCalledTimes(1);
      expect(removeEventListener).toHaveBeenCalledTimes(1);
      expect(removeEventListener).toHaveBeenNthCalledWith(1, 'resize', expect.any(Function));
      expect(addEventListener).toHaveBeenCalledTimes(1);
      expect(addEventListener).toHaveBeenNthCalledWith(1, 'resize', expect.any(Function));
      expect(mockWrite).toHaveBeenCalledTimes(1);
      expect(mockWrite).toHaveBeenNthCalledWith(1, 'zoom_with_window', true);
      expect(result).toBeTruthy();
    });

    test('default is true', () => {
      mockRead.mockReturnValue(true);
      const addEventListener = jest.spyOn(window, 'addEventListener');
      const removeEventListener = jest.spyOn(window, 'removeEventListener');
      const result = viewMenu.toggleZoomWithWindow();
      expect(resetView).toHaveBeenCalledTimes(1);
      expect(removeEventListener).toHaveBeenCalledTimes(1);
      expect(removeEventListener).toHaveBeenNthCalledWith(1, 'resize', expect.any(Function));
      expect(addEventListener).not.toHaveBeenCalled();
      expect(mockWrite).toHaveBeenCalledTimes(1);
      expect(mockWrite).toHaveBeenNthCalledWith(1, 'zoom_with_window', false);
      expect(result).toBeFalsy();
    });
  });

  describe('test toggleAntiAliasing', () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    test('default is false', () => {
      mockRead.mockReturnValue(false);
      const result = viewMenu.toggleAntiAliasing();
      expect(mockWrite).toHaveBeenCalledTimes(1);
      expect(mockWrite).toHaveBeenNthCalledWith(1, 'anti-aliasing', true);
      expect(result).toBeTruthy();
    });

    test('default is true', () => {
      mockRead.mockReturnValue(true);
      const result = viewMenu.toggleAntiAliasing();
      expect(mockWrite).toHaveBeenCalledTimes(1);
      expect(mockWrite).toHaveBeenNthCalledWith(1, 'anti-aliasing', false);
      expect(result).toBeFalsy();
    });
  });
});
