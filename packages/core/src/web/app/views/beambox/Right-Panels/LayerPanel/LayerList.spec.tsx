import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { LayerPanelContext } from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelContext';

const mockDrawing = {
  all_layers: [],
  getCurrentLayerName: jest.fn(),
  getLayerColor: jest.fn(),
  getLayerVisibility: jest.fn(),
  identifyLayers: jest.fn(),
};

const mockGetSupportedModules = jest.fn();

jest.mock('@core/app/constants/workarea-constants', () => ({
  getSupportedModules: mockGetSupportedModules,
}));

import LayerList from './LayerList';

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (cb) =>
    cb({
      Canvas: {
        getCurrentDrawing: () => mockDrawing,
      },
    }),
}));

const mockUseWorkarea = jest.fn();

jest.mock(
  '@core/helpers/hooks/useWorkarea',
  () =>
    (...args) =>
      mockUseWorkarea(...args),
);

const mockGetData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getData: (...args) => mockGetData(...args),
}));

const mockGetAllLayerNames = jest.fn();
const mockGetLayerElementByName = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getAllLayerNames: () => mockGetAllLayerNames(),
  getLayerElementByName: (...args) => mockGetLayerElementByName(...args),
}));

jest.mock('@core/app/views/beambox/Right-Panels/contexts/LayerPanelContext', () => ({
  LayerPanelContext: React.createContext(null),
}));

const mockUseIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

jest.mock(
  '@core/app/widgets/ColorPicker',
  () =>
    ({ disabled, initColor, onChange, printerColor, triggerSize }: any) => (
      <div>
        MockColorPicker
        <p>disabled: {disabled ? 'y' : 'n'}</p>
        <p>initColor: {initColor}</p>
        <p>triggerSize: {triggerSize}</p>
        <p>printerColor: {printerColor ? 'y' : 'n'}</p>
        <button onClick={() => onChange('#000000')} type="button">
          changeColor
        </button>
      </div>
    ),
);

const mockOnLayerClick = jest.fn();
const mockHighlightLayer = jest.fn();
const mockOnLayerDragStart = jest.fn();
const mockOnLayerDragEnd = jest.fn();
const mockOnLayerTouchStart = jest.fn();
const mockOnLayerTouchMove = jest.fn();
const mockOnLayerTouchEnd = jest.fn();
const mockOnSensorAreaDragEnter = jest.fn();
const mockOnLayerCenterDragEnter = jest.fn();
const mockOnLayerDoubleClick = jest.fn();
const mockOnLayerColorChange = jest.fn();
const mockSetLayerVisibility = jest.fn();
const mockUnLockLayers = jest.fn();

describe('test LayerList', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUseIsMobile.mockReturnValue(false);
    mockGetSupportedModules.mockReturnValue([15]);
  });

  it('should render correctly', () => {
    mockUseWorkarea.mockReturnValue('fbm1');
    mockGetData.mockImplementation((layer, key) => {
      if (key === 'module') {
        return 2;
      }

      return false;
    });
    mockGetAllLayerNames.mockReturnValue(['layer1', 'layer2']);

    const mockLayer = {
      getAttribute: jest.fn(),
    };

    mockLayer.getAttribute
      .mockReturnValueOnce('true')
      .mockReturnValueOnce('1')
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('false')
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('1');
    mockGetLayerElementByName.mockReturnValue(mockLayer);
    mockDrawing.getLayerVisibility.mockReturnValueOnce(true).mockReturnValueOnce(false);
    mockDrawing.getLayerColor.mockReturnValueOnce('#000000').mockReturnValueOnce('#ffffff');

    const { container } = render(
      <LayerPanelContext.Provider value={{ selectedLayers: ['layer1'] } as any}>
        <LayerList
          draggingDestIndex={null}
          highlightLayer={mockHighlightLayer}
          onLayerCenterDragEnter={mockOnLayerCenterDragEnter}
          onLayerClick={mockOnLayerClick}
          onLayerColorChange={mockOnLayerColorChange}
          onLayerDoubleClick={mockOnLayerDoubleClick}
          onLayerDragEnd={mockOnLayerDragEnd}
          onLayerDragStart={mockOnLayerDragStart}
          onLayerTouchEnd={mockOnLayerTouchEnd}
          onLayerTouchMove={mockOnLayerTouchMove}
          onLayerTouchStart={mockOnLayerTouchStart}
          onSensorAreaDragEnter={mockOnSensorAreaDragEnter}
          setLayerVisibility={mockSetLayerVisibility}
          unLockLayers={mockUnLockLayers}
        />
      </LayerPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    expect(mockUseWorkarea).toHaveBeenCalledTimes(1);
    expect(mockGetData).toHaveBeenCalledTimes(4);
    expect(mockGetData).toHaveBeenNthCalledWith(1, mockLayer, 'module');
    expect(mockGetData).toHaveBeenNthCalledWith(2, mockLayer, 'ref');
    expect(mockGetData).toHaveBeenNthCalledWith(3, mockLayer, 'module');
    expect(mockGetData).toHaveBeenNthCalledWith(4, mockLayer, 'ref');
    expect(mockLayer.getAttribute).toHaveBeenCalledTimes(4);
    expect(mockLayer.getAttribute).toHaveBeenNthCalledWith(1, 'data-lock');
    expect(mockLayer.getAttribute).toHaveBeenNthCalledWith(2, 'data-fullcolor');
    expect(mockLayer.getAttribute).toHaveBeenNthCalledWith(3, 'data-lock');
    expect(mockLayer.getAttribute).toHaveBeenNthCalledWith(4, 'data-fullcolor');
    expect(mockDrawing.getLayerVisibility).toHaveBeenCalledTimes(2);
    expect(mockDrawing.getLayerVisibility).toHaveBeenNthCalledWith(1, 'layer2');
    expect(mockDrawing.getLayerVisibility).toHaveBeenNthCalledWith(2, 'layer1');
    expect(mockDrawing.getLayerColor).toHaveBeenCalledTimes(1);
    expect(mockDrawing.getLayerColor).toHaveBeenNthCalledWith(1, 'layer1');
  });

  it('should render correctly on mobile', () => {
    mockGetAllLayerNames.mockReturnValue(['layer1', 'layer2']);

    const mockLayer = {
      getAttribute: jest.fn(),
    };

    mockLayer.getAttribute.mockReturnValueOnce('true').mockReturnValueOnce('false');
    mockGetLayerElementByName.mockReturnValue(mockLayer);
    mockDrawing.getLayerVisibility.mockReturnValueOnce(true).mockReturnValueOnce(false);
    mockDrawing.getLayerColor.mockReturnValueOnce('#000000').mockReturnValueOnce('#ffffff');
    mockUseIsMobile.mockReturnValue(true);

    const { container } = render(
      <LayerPanelContext.Provider value={{ selectedLayers: ['layer1'] } as any}>
        <LayerList
          draggingDestIndex={null}
          highlightLayer={mockHighlightLayer}
          onLayerCenterDragEnter={mockOnLayerCenterDragEnter}
          onLayerClick={mockOnLayerClick}
          onLayerColorChange={mockOnLayerColorChange}
          onLayerDoubleClick={mockOnLayerDoubleClick}
          onLayerDragEnd={mockOnLayerDragEnd}
          onLayerDragStart={mockOnLayerDragStart}
          onLayerTouchEnd={mockOnLayerTouchEnd}
          onLayerTouchMove={mockOnLayerTouchMove}
          onLayerTouchStart={mockOnLayerTouchStart}
          onSensorAreaDragEnter={mockOnSensorAreaDragEnter}
          setLayerVisibility={mockSetLayerVisibility}
          unLockLayers={mockUnLockLayers}
        />
      </LayerPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  test('event should be handled correctly', () => {
    mockGetAllLayerNames.mockReturnValue(['layer1', 'layer2']);

    const mockLayer = {
      getAttribute: jest.fn(),
    };

    mockLayer.getAttribute.mockReturnValueOnce('true').mockReturnValueOnce('false');
    mockGetLayerElementByName.mockReturnValue(mockLayer);
    mockDrawing.getLayerVisibility.mockReturnValueOnce(true).mockReturnValueOnce(false);
    mockDrawing.getLayerColor.mockReturnValueOnce('#000000').mockReturnValueOnce('#ffffff');

    const { container, getAllByText, getByTestId } = render(
      <LayerPanelContext.Provider value={{ selectedLayers: ['layer1'] } as any}>
        <LayerList
          draggingDestIndex={null}
          highlightLayer={mockHighlightLayer}
          onLayerCenterDragEnter={mockOnLayerCenterDragEnter}
          onLayerClick={mockOnLayerClick}
          onLayerColorChange={mockOnLayerColorChange}
          onLayerDoubleClick={mockOnLayerDoubleClick}
          onLayerDragEnd={mockOnLayerDragEnd}
          onLayerDragStart={mockOnLayerDragStart}
          onLayerTouchEnd={mockOnLayerTouchEnd}
          onLayerTouchMove={mockOnLayerTouchMove}
          onLayerTouchStart={mockOnLayerTouchStart}
          onSensorAreaDragEnter={mockOnSensorAreaDragEnter}
          setLayerVisibility={mockSetLayerVisibility}
          unLockLayers={mockUnLockLayers}
        />
      </LayerPanelContext.Provider>,
    );
    const layer1Item = getByTestId('layer1');

    expect(mockOnLayerClick).not.toHaveBeenCalled();
    fireEvent.click(layer1Item);
    expect(mockOnLayerClick).toHaveBeenCalledTimes(1);
    expect(mockOnLayerClick).toHaveBeenLastCalledWith(expect.anything(), 'layer1');

    expect(mockHighlightLayer).not.toHaveBeenCalled();
    fireEvent.mouseOver(layer1Item);
    expect(mockHighlightLayer).toHaveBeenCalledTimes(1);
    expect(mockHighlightLayer).toHaveBeenLastCalledWith('layer1');
    fireEvent.mouseOut(layer1Item);
    expect(mockHighlightLayer).toHaveBeenCalledTimes(2);
    expect(mockHighlightLayer).toHaveBeenLastCalledWith();

    expect(mockOnLayerDragStart).not.toHaveBeenCalled();
    fireEvent.dragStart(layer1Item);
    expect(mockOnLayerDragStart).toHaveBeenCalledTimes(1);
    expect(mockOnLayerDragStart).toHaveBeenLastCalledWith('layer1', expect.anything());

    expect(mockOnLayerDragEnd).not.toHaveBeenCalled();
    fireEvent.dragEnd(layer1Item);
    expect(mockOnLayerDragEnd).toHaveBeenCalledTimes(1);

    expect(mockOnLayerTouchStart).not.toHaveBeenCalled();
    fireEvent.touchStart(layer1Item);
    expect(mockOnLayerTouchStart).toHaveBeenCalledTimes(1);
    expect(mockOnLayerTouchStart).toHaveBeenLastCalledWith('layer1', expect.anything(), 800);

    expect(mockOnLayerTouchMove).not.toHaveBeenCalled();
    fireEvent.touchMove(layer1Item);
    expect(mockOnLayerTouchMove).toHaveBeenCalledTimes(1);

    expect(mockOnLayerTouchEnd).not.toHaveBeenCalled();
    fireEvent.touchEnd(layer1Item);
    expect(mockOnLayerTouchEnd).toHaveBeenCalledTimes(1);

    const dragSensorAreas = container.querySelectorAll('.drag-sensor-area');

    expect(mockOnSensorAreaDragEnter).not.toHaveBeenCalled();
    expect(dragSensorAreas).toHaveLength(4);
    fireEvent.dragEnter(dragSensorAreas[0]);
    expect(mockOnSensorAreaDragEnter).toHaveBeenCalledTimes(1);
    expect(mockOnSensorAreaDragEnter).toHaveBeenLastCalledWith(2);

    const layer2Center = container.querySelectorAll('.row')[0];

    expect(mockOnLayerCenterDragEnter).not.toHaveBeenCalled();
    fireEvent.dragEnter(layer2Center);
    expect(mockOnLayerCenterDragEnter).toHaveBeenCalledTimes(1);
    expect(mockOnLayerCenterDragEnter).toHaveBeenLastCalledWith('layer2');

    expect(mockOnLayerColorChange).not.toHaveBeenCalled();
    fireEvent.click(getAllByText('changeColor')[0]);
    expect(mockOnLayerColorChange).toHaveBeenCalledTimes(1);
    expect(mockOnLayerColorChange).toHaveBeenLastCalledWith('layer2', '#000000');

    const layer1Vis = container.querySelectorAll('.vis')[1];

    expect(mockSetLayerVisibility).not.toHaveBeenCalled();
    fireEvent.click(layer1Vis);
    expect(mockSetLayerVisibility).toHaveBeenCalledTimes(1);
    expect(mockSetLayerVisibility).toHaveBeenLastCalledWith('layer1');

    const layerLocks = container.querySelectorAll('.lock');

    expect(mockUnLockLayers).not.toHaveBeenCalled();
    fireEvent.click(layerLocks[1]);
    expect(mockUnLockLayers).not.toHaveBeenCalled();
    fireEvent.click(layerLocks[0]);
    expect(mockUnLockLayers).toHaveBeenCalledTimes(1);
    expect(mockUnLockLayers).toHaveBeenLastCalledWith('layer2');
  });
});
