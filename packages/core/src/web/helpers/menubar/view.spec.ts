const subscribedEvents = {};

const mockGetGlobalPreference = jest.fn();
const mockSubscribe = jest.fn();
const mockSet = jest.fn();

const mockGlobalPreference = {
  'anti-aliasing': false,
  set: mockSet,
  show_grids: true,
  show_rulers: true,
  use_layer_color: true,
  zoom_with_window: true,
};

jest.mock('@core/app/stores/globalPreferenceStore', () => ({
  useGlobalPreferenceStore: {
    getState: mockGetGlobalPreference,
    subscribe: mockSubscribe,
  },
}));
mockGetGlobalPreference.mockReturnValue(mockGlobalPreference);
mockSubscribe.mockImplementation((selector, callback) => {
  const key = selector({
    'anti-aliasing': 'anti-aliasing',
    use_layer_color: 'use_layer_color',
    zoom_with_window: 'zoom_with_window',
  });

  subscribedEvents[key] = callback;
});

import viewMenu from './view';

const resetView = jest.fn();

jest.mock('@core/app/svgedit/workarea', () => ({
  resetView: (...args) => resetView(...args),
}));

const updateLayerColor = jest.fn();

jest.mock(
  '@core/helpers/color/updateLayerColor',
  () =>
    (...args) =>
      updateLayerColor(...args),
);

describe('test view', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetGlobalPreference.mockReturnValue(mockGlobalPreference);
    mockSubscribe.mockImplementation((selector, callback) => {
      const key = selector({
        'anti-aliasing': 'anti-aliasing',
        use_layer_color: 'use_layer_color',
        zoom_with_window: 'zoom_with_window',
      });

      subscribedEvents[key] = callback;
    });
  });

  describe('test updateAntiAliasing', () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    test('svg content is existing', () => {
      document.body.innerHTML = '<div id="svgcontent" />';
      viewMenu.initAntiAliasing();
      expect(document.body.innerHTML).toBe('<div id="svgcontent" style="shape-rendering: optimizeSpeed;"></div>');
      subscribedEvents['anti-aliasing'](true);
      expect(document.body.innerHTML).toBe('<div id="svgcontent" style=""></div>');
    });

    test('svg content does not exist', () => {
      document.body.innerHTML = '<div id="abcde" />';
      viewMenu.initAntiAliasing();
      expect(document.body.innerHTML).toBe('<div id="abcde"></div>');
    });
  });

  test('test toggleLayerColor', () => {
    mockGetGlobalPreference.mockReturnValue({ ...mockGlobalPreference, use_layer_color: false });
    document.body.innerHTML = '<g class="layer" /><g class="layer" />';

    const result = viewMenu.toggleLayerColor();

    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenNthCalledWith(1, 'use_layer_color', true);
    expect(result).toBeTruthy();

    expect(updateLayerColor).not.toHaveBeenCalled();
    subscribedEvents['use_layer_color']();
    expect(updateLayerColor).toHaveBeenCalledTimes(2);
  });

  test('test toggleGrid', () => {
    mockGetGlobalPreference.mockReturnValue({ ...mockGlobalPreference, show_grids: true });

    const result = viewMenu.toggleGrid();

    expect(mockGetGlobalPreference).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenNthCalledWith(1, 'show_grids', false);
    expect(result).toBeFalsy();
  });

  describe('test toggleRulers', () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    test('default is false', () => {
      mockGetGlobalPreference.mockReturnValue({ ...mockGlobalPreference, show_rulers: false });

      const result = viewMenu.toggleRulers();

      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenNthCalledWith(1, 'show_rulers', true);
      expect(result).toBeTruthy();
    });

    test('default is true', () => {
      mockGetGlobalPreference.mockReturnValue({ ...mockGlobalPreference, show_rulers: true });

      const result = viewMenu.toggleRulers();

      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenNthCalledWith(1, 'show_rulers', false);
      expect(result).toBeFalsy();
    });
  });

  describe('test toggleZoomWithWindow', () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    test('default is false', () => {
      mockGetGlobalPreference.mockReturnValue({ ...mockGlobalPreference, zoom_with_window: false });

      const result = viewMenu.toggleZoomWithWindow();

      expect(resetView).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenNthCalledWith(1, 'zoom_with_window', true);
      expect(result).toBeTruthy();

      const addEventListener = jest.spyOn(window, 'addEventListener');
      const removeEventListener = jest.spyOn(window, 'removeEventListener');

      subscribedEvents['zoom_with_window'](result);
      expect(removeEventListener).toHaveBeenCalledTimes(1);
      expect(removeEventListener).toHaveBeenNthCalledWith(1, 'resize', expect.any(Function));
      expect(addEventListener).toHaveBeenCalledTimes(1);
      expect(addEventListener).toHaveBeenNthCalledWith(1, 'resize', expect.any(Function));
    });

    test('default is true', () => {
      mockGetGlobalPreference.mockReturnValue({ ...mockGlobalPreference, zoom_with_window: true });

      const result = viewMenu.toggleZoomWithWindow();

      expect(resetView).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenNthCalledWith(1, 'zoom_with_window', false);
      expect(result).toBeFalsy();

      const addEventListener = jest.spyOn(window, 'addEventListener');
      const removeEventListener = jest.spyOn(window, 'removeEventListener');

      subscribedEvents['zoom_with_window'](result);
      expect(removeEventListener).toHaveBeenCalledTimes(1);
      expect(removeEventListener).toHaveBeenNthCalledWith(1, 'resize', expect.any(Function));
      expect(addEventListener).not.toHaveBeenCalled();
    });
  });

  describe('test toggleAntiAliasing', () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    test('default is false', () => {
      mockGetGlobalPreference.mockReturnValue({ ...mockGlobalPreference, 'anti-aliasing': false });

      const result = viewMenu.toggleAntiAliasing();

      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenNthCalledWith(1, 'anti-aliasing', true);
      expect(result).toBeTruthy();
    });

    test('default is true', () => {
      mockGetGlobalPreference.mockReturnValue({ ...mockGlobalPreference, 'anti-aliasing': true });

      const result = viewMenu.toggleAntiAliasing();

      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(mockSet).toHaveBeenNthCalledWith(1, 'anti-aliasing', false);
      expect(result).toBeFalsy();
    });
  });
});
