import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import useLayerStore, { mockForceUpdate } from '@mocks/@core/app/stores/layer/layerStore';

import SingleColorBlock from './SingleColorBlock';

const mockBatchCommand = jest.fn();

jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: function BatchCommand(...args) {
    return mockBatchCommand(...args);
  },
}));

const mockToggleFullColorLayer = jest.fn();

jest.mock(
  '@core/helpers/layer/full-color/toggleFullColorLayer',
  () =>
    (...args) =>
      mockToggleFullColorLayer(...args),
);

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
}));

const mockGetData = jest.fn();
const mockGetMultiSelectData = jest.fn();
const mockWriteDataLayer = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getData: (...args) => mockGetData(...args),
  getMultiSelectData: (...args) => mockGetMultiSelectData(...args),
  writeDataLayer: (...args) => mockWriteDataLayer(...args),
}));

const mockGetLayerByName = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getLayerByName: (...args) => mockGetLayerByName(...args),
}));

const mockInitState = jest.fn();

jest.mock('./initState', () => () => mockInitState());

const mockUseConfigPanelStore = jest.fn();
const mockChange = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: (...args) => mockUseConfigPanelStore(...args),
}));

describe('test SingleColorBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLayerStore.setState({ selectedLayers: ['layer1', 'layer2'] });
    mockUseConfigPanelStore.mockReturnValue({
      change: mockChange,
      fullcolor: { hasMultiValue: false, value: true },
      split: { value: false },
      update: mockUpdate,
    });
  });

  it('should render correctly', () => {
    const { container } = render(<SingleColorBlock />);

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

    const { container } = render(<SingleColorBlock />);
    const btn = container.querySelector('button#single-color');

    fireEvent.click(btn);
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenNthCalledWith(1, 'Toggle full color');
    expect(mockChange).toHaveBeenCalledTimes(1);
    expect(mockChange).toHaveBeenNthCalledWith(1, { fullcolor: false });
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenNthCalledWith(1, { color: 'mock-multi-select-data' });
    expect(mockGetLayerByName).toHaveBeenCalledTimes(2);
    expect(mockGetData).toHaveBeenCalledTimes(4);
    expect(mockToggleFullColorLayer).toHaveBeenCalledTimes(2);
    expect(mockToggleFullColorLayer).toHaveBeenNthCalledWith(1, mockLayers.layer1, { val: false });
    expect(mockToggleFullColorLayer).toHaveBeenNthCalledWith(2, mockLayers.layer2, { val: false });
    expect(mockBatchCommandInstance.addSubCommand).toHaveBeenCalledTimes(2);
    expect(mockBatchCommandInstance.addSubCommand).toHaveBeenNthCalledWith(1, mockSubCmd);
    expect(mockBatchCommandInstance.addSubCommand).toHaveBeenNthCalledWith(2, mockSubCmd);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, mockBatchCommandInstance);
    expect(mockForceUpdate).toHaveBeenCalledTimes(1);
  });
});
