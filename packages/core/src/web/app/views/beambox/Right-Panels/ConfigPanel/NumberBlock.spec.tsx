import React from 'react';

import ConfigPanelContext from './ConfigPanelContext';

import { fireEvent, render } from '@testing-library/react';

const mockGetData = jest.fn();
const mockGetMultiSelectData = jest.fn();
const mockWriteDataLayer = jest.fn();
const mockGetLayerByName = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  CUSTOM_PRESET_CONSTANT: 'CUSTOM_PRESET_CONSTANT',
  getData: (...args) => mockGetData(...args),
  getMultiSelectData: (...args) => mockGetMultiSelectData(...args),
  presetRelatedConfigs: new Set(['speed']),
  timeRelatedConfigs: new Set(['speed']),
  writeDataLayer: (...args) => mockWriteDataLayer(...args),
}));

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getLayerByName: (...args) => mockGetLayerByName(...args),
}));

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
}));

let batchCmd = { count: 0, onAfter: undefined };
const mockBatchCommand = jest.fn().mockImplementation(() => {
  batchCmd = { count: batchCmd.count + 1, onAfter: undefined };

  return batchCmd;
});

jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: mockBatchCommand,
}));

const mockCreateEventEmitter = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: (...args) => mockCreateEventEmitter(...args),
}));

const mockEmit = jest.fn();

jest.mock('@core/app/views/beambox/Right-Panels/contexts/LayerPanelContext', () => ({
  LayerPanelContext: React.createContext({ hasVector: false }),
}));

jest.mock('@core/app/views/beambox/Right-Panels/contexts/ObjectPanelContext', () => ({
  ObjectPanelContext: React.createContext({ activeKey: null }),
}));

const mockStorageGet = jest.fn();

jest.mock('@core/implementations/storage', () => ({
  get: (...args) => mockStorageGet(...args),
}));

const mockDispatch = jest.fn();
const mockInitState = jest.fn();

const mockSelectedLayers = ['layer1', 'layer2'];
const mockContextState = {
  selectedLayer: 'layer1',
  speed: { hasMultiValue: false, value: 87 },
};

import NumberBlock from './NumberBlock';

describe('test NumberBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateEventEmitter.mockReturnValueOnce({
      emit: mockEmit,
    });
    mockStorageGet.mockReturnValue('mm');
  });

  it('should render correctly', () => {
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <NumberBlock
          configKey="speed"
          hasSlider
          id="id"
          max={100}
          min={0}
          precision={2}
          step={1}
          title="title"
          tooltip="tooltip"
          type="default"
          unit="mm"
        />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when type is panel-item', () => {
    const { container, rerender } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <NumberBlock
          configKey="speed"
          hasSlider
          id="id"
          max={100}
          min={0}
          precision={2}
          step={1}
          title="title"
          tooltip="tooltip"
          type="panel-item"
          unit="mm"
        />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();

    rerender(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <NumberBlock
          configKey="speed"
          hasSlider
          id="id"
          max={100}
          min={0}
          panelType="button"
          precision={2}
          step={1}
          title="title"
          tooltip="tooltip"
          type="panel-item"
          unit="mm"
        />
      </ConfigPanelContext.Provider>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render correctly when unit is in inches', () => {
    mockStorageGet.mockReturnValue('inches');

    const { getByText } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <NumberBlock
          configKey="speed"
          hasSlider
          id="id"
          max={100}
          min={0}
          precision={2}
          step={1}
          title="title"
          tooltip="tooltip"
          type="default"
          unit="mm"
        />
      </ConfigPanelContext.Provider>,
    );

    expect(getByText('unit: in')).toBeInTheDocument();
  });

  it('should still use mm when forceUsePropsUnit set', () => {
    mockStorageGet.mockReturnValue('inches');

    const { getByText } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <NumberBlock
          configKey="speed"
          forceUsePropsUnit
          hasSlider
          id="id"
          max={100}
          min={0}
          precision={2}
          step={1}
          title="title"
          tooltip="tooltip"
          type="default"
          unit="mm"
        />
      </ConfigPanelContext.Provider>,
    );

    expect(getByText('unit: mm')).toBeInTheDocument();
  });

  test('should handle change correctly', () => {
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <NumberBlock
          configKey="speed"
          hasSlider
          id="id"
          max={100}
          min={0}
          precision={2}
          step={1}
          title="title"
          tooltip="tooltip"
          type="default"
          unit="mm"
        />
      </ConfigPanelContext.Provider>,
    );
    const input = container.querySelector('input');

    mockGetLayerByName.mockReturnValue('mock-layer');

    fireEvent.change(input, { target: { value: '50' } });
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenCalledWith('SET_ESTIMATED_TIME', null);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({
      payload: { configName: 'CUSTOM_PRESET_CONSTANT', speed: 50 },
      type: 'change',
    });
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenCalledWith('Change speed');
    expect(mockWriteDataLayer).toHaveBeenCalledTimes(4);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(1, 'mock-layer', 'speed', 50, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(2, 'mock-layer', 'configName', 'CUSTOM_PRESET_CONSTANT', {
      batchCmd,
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(3, 'mock-layer', 'speed', 50, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(4, 'mock-layer', 'configName', 'CUSTOM_PRESET_CONSTANT', {
      batchCmd,
    });
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenCalledWith(batchCmd);
  });
});
