import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import useLayerStore from '@core/app/stores/layer/layerStore';

const mockGetSupportedModules = jest.fn();

jest.mock('@core/app/constants/workarea-constants', () => ({
  getSupportedModules: mockGetSupportedModules,
}));

const mockGetCurrentLayerName = jest.fn();
const mockGetAllLayers = jest.fn();
const mockGetAllLayerNames = jest.fn();
const mockIdentifyLayers = jest.fn();
const mockGetLayerByName = jest.fn();

jest.mock('@core/app/svgedit/layer/layerManager', () => ({
  getAllLayerNames: () => mockGetAllLayerNames(),
  getAllLayers: (...args) => mockGetAllLayers(...args),
  getCurrentLayerName: (...args) => mockGetCurrentLayerName(...args),
  getLayerByName: (...args) => mockGetLayerByName(...args),
  identifyLayers: (...args) => mockIdentifyLayers(...args),
}));

import LayerList from './LayerList';

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

jest.mock('@core/helpers/layer/layer-helper', () => ({
  setLayerLock: jest.fn(),
}));

const mockDeleteLayerByName = jest.fn();

jest.mock('@core/helpers/layer/deleteLayer', () => ({
  deleteLayerByName: (...args) => mockDeleteLayerByName(...args),
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
      if (key === 'module') return 2;

      if (key === 'color') return layer === mockLayer1 ? '#ffffff' : '#000000';

      return false;
    });
    mockGetAllLayerNames.mockReturnValue(['layer1', 'layer2']);

    const mockLayer1 = { getAttribute: jest.fn() };
    const mockLayer2 = { getAttribute: jest.fn() };

    const mockLayerObject1 = {
      getGroup: () => mockLayer1,
      isVisible: jest.fn().mockReturnValue(false),
    };
    const mockLayerObject2 = {
      getGroup: () => mockLayer2,
      isVisible: jest.fn().mockReturnValue(true),
    };

    mockLayer1.getAttribute.mockReturnValueOnce('false').mockReturnValueOnce(null);
    mockLayer2.getAttribute.mockReturnValueOnce('true').mockReturnValueOnce('1');

    mockGetLayerByName.mockImplementation((layerName) =>
      layerName === 'layer1' ? mockLayerObject1 : mockLayerObject2,
    );
    mockGetAllLayers.mockReturnValue([mockLayerObject1, mockLayerObject2]);
    useLayerStore.setState({ selectedLayers: ['layer1'] });

    const { container } = render(
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
      />,
    );

    expect(container).toMatchSnapshot();
    expect(mockUseWorkarea).toHaveBeenCalledTimes(1);
    expect(mockGetData).toHaveBeenCalledTimes(8);
    expect(mockLayer1.getAttribute).toHaveBeenCalledTimes(1);
    expect(mockLayer1.getAttribute).toHaveBeenNthCalledWith(1, 'data-lock');
    expect(mockLayer2.getAttribute).toHaveBeenCalledTimes(1);
    expect(mockLayer2.getAttribute).toHaveBeenNthCalledWith(1, 'data-lock');
    expect(mockLayerObject1.isVisible).toHaveBeenCalledTimes(1);
    expect(mockLayerObject2.isVisible).toHaveBeenCalledTimes(1);
  });

  it('should render correctly on mobile', () => {
    mockGetAllLayerNames.mockReturnValue(['layer1', 'layer2']);

    const mockLayer1 = { getAttribute: jest.fn() };
    const mockLayer2 = { getAttribute: jest.fn() };

    const mockLayerObject1 = {
      getGroup: () => mockLayer1,
      isVisible: jest.fn().mockReturnValue(false),
    };
    const mockLayerObject2 = {
      getGroup: () => mockLayer2,
      isVisible: jest.fn().mockReturnValue(true),
    };

    mockLayer1.getAttribute.mockReturnValue('false');
    mockLayer2.getAttribute.mockReturnValue('true');

    mockGetLayerByName.mockImplementation((layerName) =>
      layerName === 'layer1' ? mockLayerObject1 : mockLayerObject2,
    );

    mockGetAllLayers.mockReturnValue([mockLayerObject1, mockLayerObject2]);
    mockGetData.mockImplementation((layer, key) => {
      if (key === 'color') {
        return layer === mockLayer1 ? '#ffffff' : '#000000';
      }

      return false;
    });
    mockUseIsMobile.mockReturnValue(true);
    useLayerStore.setState({ selectedLayers: ['layer1'] });

    const { container } = render(
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
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('event should be handled correctly', () => {
    mockGetAllLayerNames.mockReturnValue(['layer1', 'layer2']);

    const mockLayer1 = {
      getAttribute: jest.fn(),
    };
    const mockLayer2 = {
      getAttribute: jest.fn(),
    };

    const mockLayerObject1 = {
      getGroup: () => mockLayer1,
      isVisible: jest.fn().mockReturnValue(false),
    };
    const mockLayerObject2 = {
      getGroup: () => mockLayer2,
      isVisible: jest.fn().mockReturnValue(true),
    };

    mockLayer1.getAttribute.mockReturnValue('false');
    mockLayer2.getAttribute.mockReturnValue('true');

    mockGetLayerByName.mockImplementation((layerName) =>
      layerName === 'layer1' ? mockLayerObject1 : mockLayerObject2,
    );

    mockGetAllLayers.mockReturnValue([mockLayerObject1, mockLayerObject2]);
    mockGetData.mockImplementation((layer, key) => {
      if (key === 'color') {
        return layer === mockLayer1 ? '#ffffff' : '#000000';
      }

      return false;
    });
    useLayerStore.setState({ selectedLayers: ['layer1'] });

    const { container, getAllByText, getByTestId } = render(
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
      />,
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
