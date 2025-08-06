import updateLayerColor from './updateLayerColor';

const mockGetState = jest.fn();

jest.mock('@core/app/stores/globalPreferenceStore', () => ({
  useGlobalPreferenceStore: {
    getState: () => mockGetState(),
  },
}));

const mockGetLayerName = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getLayerName: (...args) => mockGetLayerName(...args),
}));

const mockGetTempGroup = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (cb) =>
    cb({
      Canvas: {
        getTempGroup: (...args) => mockGetTempGroup(...args),
      },
    }),
}));

const mockSetElementsColor = jest.fn();

jest.mock(
  '@core/helpers/color/setElementsColor',
  () =>
    (...args) =>
      mockSetElementsColor(...args),
);

const mockUpdateLayerColorFilter = jest.fn();

jest.mock(
  '@core/helpers/color/updateLayerColorFilter',
  () =>
    (...args) =>
      mockUpdateLayerColorFilter(...args),
);

describe('test updateLayerColor', () => {
  it('should update layer color', async () => {
    const layer = document.createElement('g');
    const mockRect = document.createElement('rect');

    layer.appendChild(mockRect);
    layer.setAttribute('data-color', '#123456');
    mockGetState.mockReturnValue({ use_layer_color: true });
    mockGetLayerName.mockReturnValueOnce(null);
    await updateLayerColor(layer as Element as SVGGElement);
    expect(mockGetState).toHaveBeenCalledTimes(1);
    expect(mockSetElementsColor).toHaveBeenCalledWith([mockRect], '#123456', false);
    expect(mockUpdateLayerColorFilter).toHaveBeenCalledWith(layer);
  });
});
