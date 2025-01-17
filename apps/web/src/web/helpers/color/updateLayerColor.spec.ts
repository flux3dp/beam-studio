import updateLayerColor from './updateLayerColor';

const mockRead = jest.fn();
jest.mock('app/actions/beambox/beambox-preference', () => ({
  read: (...args) => mockRead(...args),
}));

const mockGetLayerName = jest.fn();
jest.mock('helpers/layer/layer-helper', () => ({
  getLayerName: (...args) => mockGetLayerName(...args),
}));

const mockGetTempGroup = jest.fn();
jest.mock('helpers/svg-editor-helper', () => ({
  getSVGAsync: (cb) =>
    cb({
      Canvas: {
        getTempGroup: (...args) => mockGetTempGroup(...args),
      },
    }),
}));

const mockSetElementsColor = jest.fn();
jest.mock(
  'helpers/color/setElementsColor',
  () =>
    (...args) =>
      mockSetElementsColor(...args)
);

const mockUpdateLayerColorFilter = jest.fn();
jest.mock('helpers/color/updateLayerColorFilter', () => (...args) => mockUpdateLayerColorFilter(...args));

describe('test updateLayerColor', () => {
  it('should update layer color', async () => {
    const layer = document.createElement('g');
    const mockRect = document.createElement('rect');
    layer.appendChild(mockRect);
    layer.setAttribute('data-color', '#123456');
    mockRead.mockReturnValueOnce(true);
    mockGetLayerName.mockReturnValueOnce(null);
    await updateLayerColor(layer as Element as SVGGElement);
    expect(mockRead).toBeCalledTimes(1);
    expect(mockRead).toHaveBeenNthCalledWith(1, 'use_layer_color');
    expect(mockSetElementsColor).toHaveBeenCalledWith([mockRect], '#123456', false);
    expect(mockUpdateLayerColorFilter).toHaveBeenCalledWith(layer);
  });
});
