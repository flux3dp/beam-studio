import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import ConfigPanelContext from './ConfigPanelContext';
import SingleColorBlock from './SingleColorBlock';

const mockBatchCommand = jest.fn();
jest.mock('app/svgedit/history/history', () => ({
  BatchCommand: function BatchCommand(...args) {
    return mockBatchCommand(...args);
  },
}));

const mockUpdateLayerPanel = jest.fn();
jest.mock('app/views/beambox/Right-Panels/contexts/LayerPanelController', () => ({
  updateLayerPanel: (...args) => mockUpdateLayerPanel(...args),
}));

const mockToggleFullColorLayer = jest.fn();
jest.mock(
  'helpers/layer/full-color/toggleFullColorLayer',
  () =>
    (...args) =>
      mockToggleFullColorLayer(...args)
);

const mockAddCommandToHistory = jest.fn();
jest.mock('app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
}));

const mockGetData = jest.fn();
const mockGetMultiSelectData = jest.fn();
const mockWriteDataLayer = jest.fn();
jest.mock('helpers/layer/layer-config-helper', () => ({
  getData: (...args) => mockGetData(...args),
  getMultiSelectData: (...args) => mockGetMultiSelectData(...args),
  writeDataLayer: (...args) => mockWriteDataLayer(...args),
}));

const mockGetLayerByName = jest.fn();
jest.mock('helpers/layer/layer-helper', () => ({
  getLayerByName: (...args) => mockGetLayerByName(...args),
}));

jest.mock('helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      laser_panel: {
        single_color: 'single_color',
        single_color_desc: 'single_color_desc',
      },
    },
  },
}));

const mockSelectedLayers = ['layer1', 'layer2'];
const mockContextState = {
  fullcolor: { value: true, hasMultiValue: false },
  split: { value: false },
  selectedLayer: 'layer1',
};
const mockDispatch = jest.fn();
const mockInitState = jest.fn();

describe('test SingleColorBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          state: mockContextState as any,
          dispatch: mockDispatch,
          selectedLayers: mockSelectedLayers,
          initState: mockInitState,
        }}
      >
        <SingleColorBlock />
      </ConfigPanelContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  test('toggle full color', () => {
    const mockBatchCommandInstance = { addSubCommand: jest.fn() };
    mockBatchCommand.mockReturnValue(mockBatchCommandInstance);
    const mockLayers = {
      layer1: { color: 'red' },
      layer2: { color: 'blue' },
    };
    mockGetLayerByName.mockImplementation((name) => mockLayers[name]);
    mockGetData.mockReturnValue(true);
    const mockSubCmd = { isEmpty: () => false };
    mockToggleFullColorLayer.mockReturnValue(mockSubCmd);
    mockGetMultiSelectData.mockReturnValue('mock-multi-select-data');

    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          state: mockContextState as any,
          dispatch: mockDispatch,
          selectedLayers: mockSelectedLayers,
          initState: mockInitState,
        }}
      >
        <SingleColorBlock />
      </ConfigPanelContext.Provider>
    );
    const btn = container.querySelector('button#single-color');
    fireEvent.click(btn);
    expect(mockBatchCommand).toBeCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenNthCalledWith(1, 'Toggle full color');
    expect(mockDispatch).toBeCalledTimes(2);
    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      type: 'change',
      payload: { fullcolor: false },
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(2, {
      type: 'update',
      payload: { color: 'mock-multi-select-data' },
    });
    expect(mockGetLayerByName).toBeCalledTimes(2);
    expect(mockGetData).toBeCalledTimes(4);
    expect(mockToggleFullColorLayer).toBeCalledTimes(2);
    expect(mockToggleFullColorLayer).toHaveBeenNthCalledWith(1, mockLayers.layer1, { val: false });
    expect(mockToggleFullColorLayer).toHaveBeenNthCalledWith(2, mockLayers.layer2, { val: false });
    expect(mockBatchCommandInstance.addSubCommand).toBeCalledTimes(2);
    expect(mockBatchCommandInstance.addSubCommand).toHaveBeenNthCalledWith(1, mockSubCmd);
    expect(mockBatchCommandInstance.addSubCommand).toHaveBeenNthCalledWith(2, mockSubCmd);
    expect(mockAddCommandToHistory).toBeCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, mockBatchCommandInstance);
    expect(mockUpdateLayerPanel).toBeCalledTimes(1);
  });
});
