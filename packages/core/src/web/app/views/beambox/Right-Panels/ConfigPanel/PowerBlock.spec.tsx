import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import ConfigPanelContext from './ConfigPanelContext';

jest.mock('@core/helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      laser_panel: {
        low_power_warning: 'low_power_warning',
        strength: 'strength',
      },
    },
  },
}));

jest.mock('./AdvancedPowerPanel', () => ({ onClose }: any) => (
  <div id="AdvancedPowerPanel">
    MockAdvancedPowerPanel
    <button onClick={onClose} type="button">
      AdvancedPowerPanelClose
    </button>
  </div>
));

jest.mock('./ConfigSlider', () => ({ id, max, min, onChange, value }: any) => (
  <input
    className="mock-config-slider"
    id={id}
    max={max}
    min={min}
    onChange={(e) => onChange(Number(e.target.value))}
    step={0.1}
    type="range"
    value={value}
  />
));

jest.mock(
  './ConfigValueDisplay',
  () =>
    ({
      decimal = 0,
      hasMultiValue = false,
      inputId,
      max,
      min,
      onChange,
      options,
      type = 'default',
      unit,
      value,
    }: any) => (
      <div>
        MockConfigValueDisplay
        <p>inputId: {inputId}</p>
        <p>type: {type}</p>
        <p>max: {max}</p>
        <p>min: {min}</p>
        <p>value: {value}</p>
        <p>unit: {unit}</p>
        <p>hasMultiValue: {hasMultiValue}</p>
        <p>decimal: {decimal}</p>
        <p>options: {JSON.stringify(options)}</p>
        <button onClick={() => onChange(88)} type="button">
          MockConfigValueDisplayButton
        </button>
      </div>
    ),
);

const mockGetLayerByName = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getLayerByName: (...args) => mockGetLayerByName(...args),
}));

const mockGetData = jest.fn();
const mockGetMultiSelectData = jest.fn();
const mockWriteDataLayer = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  CUSTOM_PRESET_CONSTANT: 'CUSTOM_PRESET_CONSTANT',
  getData: (...args) => mockGetData(...args),
  getMultiSelectData: (...args) => mockGetMultiSelectData(...args),
  writeDataLayer: (...args) => mockWriteDataLayer(...args),
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

const mockSelectedLayers = ['layer1', 'layer2'];
const mockContextState = {
  power: { hasMultiValue: false, value: 87 },
  selectedLayer: 'layer1',
};
const mockDispatch = jest.fn();
const mockInitState = jest.fn();

const mockCheckPwmImages = jest.fn();

jest.mock(
  '@core/helpers/layer/check-pwm-images',
  () =>
    (...args) =>
      mockCheckPwmImages(...args),
);

const mockEventsOn = jest.fn();
const mockEventsOff = jest.fn();

jest.mock('@core/app/views/beambox/Right-Panels/contexts/ObjectPanelController', () => ({
  events: {
    off: mockEventsOff,
    on: mockEventsOn,
  },
}));

import PowerBlock from './PowerBlock';

describe('test PowerBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckPwmImages.mockReturnValue(false);
    mockGetLayerByName.mockImplementation((name) => name);
    mockGetData.mockReturnValue(0);
    batchCmd = { count: 0, onAfter: undefined };
  });

  it('should render correctly', () => {
    const { container, unmount } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <PowerBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    expect(mockEventsOn).toBeCalledTimes(1);
    expect(mockEventsOn).lastCalledWith('pwm-changed', expect.any(Function));
    unmount();
    expect(mockEventsOff).toBeCalledTimes(1);
    expect(mockEventsOff).lastCalledWith('pwm-changed', expect.any(Function));
  });

  it('should render correctly when type is panel-item', () => {
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <PowerBlock type="panel-item" />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render correctly whe power is low', () => {
    const state = {
      ...mockContextState,
      power: { value: 7 },
    } as any;
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state,
        }}
      >
        <PowerBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when hasPwmImages is true', () => {
    mockCheckPwmImages.mockReturnValue(true);

    const { container, getByText } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <PowerBlock />
      </ConfigPanelContext.Provider>,
    );
    const icon = container.querySelector('.icon');

    expect(icon).not.toBeNull();
    fireEvent.click(icon);
    expect(getByText('MockAdvancedPowerPanel')).toBeInTheDocument();
  });

  test('onChange should work', () => {
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <PowerBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(mockDispatch).not.toBeCalled();
    expect(mockWriteDataLayer).not.toBeCalled();
    expect(mockBatchCommand).not.toBeCalled();
    expect(batchCmd.count).toBe(0);

    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: '88' } });
    expect(mockDispatch).toBeCalledTimes(1);
    expect(mockDispatch).toHaveBeenLastCalledWith({
      payload: { configName: 'CUSTOM_PRESET_CONSTANT', power: 88 },
      type: 'change',
    });
    expect(mockBatchCommand).toBeCalledTimes(1);
    expect(mockBatchCommand).lastCalledWith('Change power');
    expect(batchCmd.count).toBe(1);
    expect(mockGetLayerByName).toBeCalledTimes(2);
    expect(mockGetLayerByName).toHaveBeenNthCalledWith(1, 'layer1');
    expect(mockGetLayerByName).toHaveBeenNthCalledWith(2, 'layer2');
    expect(mockWriteDataLayer).toBeCalledTimes(4);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(1, 'layer1', 'power', 88, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(2, 'layer1', 'configName', 'CUSTOM_PRESET_CONSTANT', {
      batchCmd,
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(3, 'layer2', 'power', 88, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(4, 'layer2', 'configName', 'CUSTOM_PRESET_CONSTANT', {
      batchCmd,
    });
    expect(mockGetData).toBeCalledTimes(2);
    expect(mockGetData).toHaveBeenNthCalledWith(1, 'layer1', 'minPower');
    expect(mockGetData).toHaveBeenNthCalledWith(2, 'layer2', 'minPower');
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toBeCalledTimes(1);
    expect(mockAddCommandToHistory).lastCalledWith(batchCmd);
  });

  test('change power to less than minPower should work', () => {
    mockGetData.mockReturnValue(88);

    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <PowerBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(mockDispatch).not.toBeCalled();
    expect(mockWriteDataLayer).not.toBeCalled();
    expect(mockBatchCommand).not.toBeCalled();
    expect(batchCmd.count).toBe(0);
    mockGetMultiSelectData.mockReturnValue({ value: 0 });

    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: '86' } });
    expect(mockBatchCommand).toBeCalledTimes(1);
    expect(mockBatchCommand).lastCalledWith('Change power');
    expect(batchCmd.count).toBe(1);
    expect(mockGetLayerByName).toBeCalledTimes(2);
    expect(mockGetLayerByName).toHaveBeenNthCalledWith(1, 'layer1');
    expect(mockGetLayerByName).toHaveBeenNthCalledWith(2, 'layer2');
    expect(mockWriteDataLayer).toBeCalledTimes(6);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(1, 'layer1', 'power', 86, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(2, 'layer1', 'configName', 'CUSTOM_PRESET_CONSTANT', {
      batchCmd,
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(3, 'layer1', 'minPower', 0, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(4, 'layer2', 'power', 86, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(5, 'layer2', 'configName', 'CUSTOM_PRESET_CONSTANT', {
      batchCmd,
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(6, 'layer2', 'minPower', 0, { batchCmd });
    expect(mockGetData).toBeCalledTimes(2);
    expect(mockGetData).toHaveBeenNthCalledWith(1, 'layer1', 'minPower');
    expect(mockGetData).toHaveBeenNthCalledWith(2, 'layer2', 'minPower');
    expect(mockGetMultiSelectData).toBeCalledTimes(1);
    expect(mockGetMultiSelectData).lastCalledWith(['layer1', 'layer2'], 0, 'minPower');
    expect(mockDispatch).toBeCalledTimes(2);
    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      payload: { configName: 'CUSTOM_PRESET_CONSTANT', power: 86 },
      type: 'change',
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(2, {
      payload: { minPower: { value: 0 } },
      type: 'update',
    });
  });

  test('onChange of value display should work correctly', () => {
    const { getByText } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <PowerBlock type="modal" />
      </ConfigPanelContext.Provider>,
    );

    expect(getByText('type: modal')).toBeInTheDocument();
    expect(mockDispatch).not.toBeCalled();
    expect(mockWriteDataLayer).not.toBeCalled();
    fireEvent.click(getByText('MockConfigValueDisplayButton'));
    expect(mockDispatch).toBeCalledTimes(1);
    expect(mockDispatch).toHaveBeenLastCalledWith({
      payload: { configName: 'CUSTOM_PRESET_CONSTANT', power: 88 },
      type: 'change',
    });
    expect(mockWriteDataLayer).not.toBeCalled();
    expect(mockBatchCommand).not.toBeCalled();
  });
});
