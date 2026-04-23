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

const mockHasTempGroup = jest.fn();
const mockGetElementsFromTempGroupByLayer = jest.fn();

jest.mock('@core/app/svgedit/selection', () => ({
  __esModule: true,
  default: {
    getElementsFromTempGroupByLayer: (...args) => mockGetElementsFromTempGroupByLayer(...args),
    hasTempGroup: (...args) => mockHasTempGroup(...args),
  },
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
    mockHasTempGroup.mockReturnValue(false);
    await updateLayerColor(layer as Element as SVGGElement);
    expect(mockGetState).toHaveBeenCalledTimes(1);
    expect(mockSetElementsColor).toHaveBeenCalledWith([mockRect], '#123456', false);
    expect(mockUpdateLayerColorFilter).toHaveBeenCalledWith(layer);
  });
});
