/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import LayerModule from 'app/constants/layer-module/layer-modules';
import { LayerPanelContext } from 'app/views/beambox/Right-Panels/contexts/LayerPanelContext';

import ConfigPanelContext from './ConfigPanelContext';

jest.mock('helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      laser_panel: {
        speed: 'speed',
        speed_contrain_warning: 'speed_contrain_warning',
        slider: {
          very_low: 'very_low',
          low: 'low',
          regular: 'regular',
          high: 'high',
          very_high: 'very_high',
        },
      },
    },
  },
}));

jest.mock('./ConfigSlider', () => ({ id, max, min, value, onChange }: any) => (
  <input
    id={id}
    className="mock-config-slider"
    type="range"
    min={min}
    max={max}
    step={0.1}
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
  />
));

jest.mock(
  './ConfigValueDisplay',
  () =>
    ({
      inputId,
      type = 'default',
      max,
      min,
      value,
      unit,
      hasMultiValue = false,
      decimal = 0,
      onChange,
      options,
    }: any) =>
      (
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
          <button type="button" onClick={() => onChange(88)}>
            MockConfigValueDisplayButton
          </button>
        </div>
      )
);

jest.mock('app/views/beambox/Right-Panels/ObjectPanelItem', () => ({
  Item: ({ id, content, label, onClick }: any) => (
    <div onClick={onClick}>
      MockObjectPanelItem
      <div>id: {id}</div>
      <div>content: {content}</div>
      <div>label: {label}</div>
    </div>
  ),
}));

const mockWriteData = jest.fn();
jest.mock('helpers/layer/layer-config-helper', () => ({
  CUSTOM_PRESET_CONSTANT: 'CUSTOM_PRESET_CONSTANT',
  writeData: (...args) => mockWriteData(...args),
}));

const mockStorageGet = jest.fn();
jest.mock('implementations/storage', () => ({
  get: (...args) => mockStorageGet(...args),
}));

const mockPrefRead = jest.fn();
jest.mock('app/actions/beambox/beambox-preference', () => ({
  read: (...args) => mockPrefRead(...args),
}));

const mockAddCommandToHistory = jest.fn();
jest.mock('helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) =>
    callback({
      Canvas: {
        addCommandToHistory: mockAddCommandToHistory,
      },
    }),
}));

let batchCmd = { onAfter: undefined, count: 0 };
const mockBatchCommand = jest.fn().mockImplementation(() => {
  batchCmd = { onAfter: undefined, count: batchCmd.count + 1 };
  return batchCmd;
});
jest.mock('app/svgedit/history/history', () => ({
  BatchCommand: mockBatchCommand,
}));

const mockSelectedLayers = ['layer1', 'layer2'];
const mockContextState = {
  speed: { value: 87, hasMultiValue: false },
  module: { value: LayerModule.LASER_10W_DIODE, hasMultiValue: false },
};
const mockDispatch = jest.fn();
const mockInitState = jest.fn();

const mockCreateEventEmitter = jest.fn();
jest.mock('helpers/eventEmitterFactory', () => ({
  createEventEmitter: (...args) => mockCreateEventEmitter(...args),
}));
const mockEmit = jest.fn();

jest.mock('app/views/beambox/Right-Panels/contexts/LayerPanelContext', () => ({
  LayerPanelContext: React.createContext({ hasVector: false }),
}));

jest.mock('app/views/beambox/Right-Panels/contexts/ObjectPanelContext', () => ({
  ObjectPanelContext: React.createContext({ activeKey: null }),
}));

jest.mock('helpers/layer/check-vector', () => jest.fn());

// eslint-disable-next-line import/first
import SpeedBlock from './SpeedBlock';

describe('test SpeedBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateEventEmitter.mockReturnValueOnce({
      emit: mockEmit,
    });
  });

  it('should render correctly when unit is mm', () => {
    mockStorageGet.mockReturnValueOnce('mm');
    mockPrefRead.mockReturnValueOnce('fbm1').mockReturnValueOnce(true).mockReturnValueOnce(true);
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          state: mockContextState as any,
          dispatch: mockDispatch,
          selectedLayers: mockSelectedLayers,
          initState: mockInitState,
        }}
      >
        <SpeedBlock />
      </ConfigPanelContext.Provider>
    );
    expect(mockStorageGet).toBeCalledTimes(1);
    expect(mockStorageGet).toHaveBeenLastCalledWith('default-units');
    expect(mockPrefRead).toBeCalledTimes(2);
    expect(mockPrefRead).toHaveBeenNthCalledWith(1, 'workarea');
    expect(mockPrefRead).toHaveBeenNthCalledWith(2, 'enable-low-speed');
    expect(container).toMatchSnapshot();
  });

  it('should render correctly when unit is inches', () => {
    mockStorageGet.mockReturnValueOnce('inches');
    mockPrefRead.mockReturnValueOnce('fbm1').mockReturnValueOnce(true).mockReturnValueOnce(true);
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          state: mockContextState as any,
          dispatch: mockDispatch,
          selectedLayers: mockSelectedLayers,
          initState: mockInitState,
        }}
      >
        <SpeedBlock />
      </ConfigPanelContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it('should render correctly when type is panel-item', () => {
    mockStorageGet.mockReturnValueOnce('mm');
    mockPrefRead.mockReturnValueOnce('fbm1').mockReturnValueOnce(true).mockReturnValueOnce(true);
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          state: mockContextState as any,
          dispatch: mockDispatch,
          selectedLayers: mockSelectedLayers,
          initState: mockInitState,
        }}
      >
        <SpeedBlock type="panel-item" />
      </ConfigPanelContext.Provider>
    );
    expect(mockStorageGet).toBeCalledTimes(1);
    expect(mockStorageGet).toHaveBeenLastCalledWith('default-units');
    expect(mockPrefRead).toBeCalledTimes(2);
    expect(mockPrefRead).toHaveBeenNthCalledWith(1, 'workarea');
    expect(mockPrefRead).toHaveBeenNthCalledWith(2, 'enable-low-speed');
    expect(container).toMatchSnapshot();
  });

  it('should render correctly when has vector warning', () => {
    mockStorageGet.mockReturnValueOnce('mm');
    mockPrefRead.mockReturnValueOnce('fhex1').mockReturnValueOnce(true).mockReturnValueOnce(true);
    const { container } = render(
      <LayerPanelContext.Provider value={{ hasVector: true } as any}>
        <ConfigPanelContext.Provider
          value={{
            state: mockContextState as any,
            dispatch: mockDispatch,
            selectedLayers: mockSelectedLayers,
            initState: mockInitState,
          }}
        >
          <SpeedBlock />
        </ConfigPanelContext.Provider>
      </LayerPanelContext.Provider>
    );
    expect(container).toMatchSnapshot();
    expect(mockPrefRead).toBeCalledTimes(3);
    expect(mockPrefRead).toHaveBeenNthCalledWith(1, 'workarea');
    expect(mockPrefRead).toHaveBeenNthCalledWith(2, 'enable-low-speed');
    expect(mockPrefRead).toHaveBeenNthCalledWith(3, 'vector_speed_contraint');
  });

  it('should render correctly when has low speed warning', () => {
    mockStorageGet.mockReturnValueOnce('mm');
    mockPrefRead.mockReturnValueOnce('fhex1').mockReturnValueOnce(true).mockReturnValueOnce(true);
    const state = { ...mockContextState, speed: { value: 1 } };
    const { container } = render(
      <LayerPanelContext.Provider value={{ hasVector: true } as any}>
        <ConfigPanelContext.Provider
          value={{
            state: state as any,
            dispatch: mockDispatch,
            selectedLayers: mockSelectedLayers,
            initState: mockInitState,
          }}
        >
          <SpeedBlock />
        </ConfigPanelContext.Provider>
      </LayerPanelContext.Provider>
    );
    expect(container).toMatchSnapshot();
    expect(mockPrefRead).toBeCalledTimes(2);
    expect(mockPrefRead).toHaveBeenNthCalledWith(1, 'workarea');
    expect(mockPrefRead).toHaveBeenNthCalledWith(2, 'enable-low-speed');
  });

  test('onChange should work', () => {
    mockStorageGet.mockReturnValueOnce('mm');
    mockPrefRead.mockReturnValueOnce('fbm1').mockReturnValueOnce(true).mockReturnValueOnce(true);
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          state: mockContextState as any,
          dispatch: mockDispatch,
          selectedLayers: mockSelectedLayers,
          initState: mockInitState,
        }}
      >
        <SpeedBlock />
      </ConfigPanelContext.Provider>
    );
    expect(mockCreateEventEmitter).toBeCalledTimes(1);
    expect(mockCreateEventEmitter).toHaveBeenLastCalledWith('time-estimation-button');

    expect(mockDispatch).not.toBeCalled();
    expect(mockWriteData).not.toBeCalled();
    expect(mockEmit).not.toBeCalled();
    expect(mockBatchCommand).not.toBeCalled();
    expect(batchCmd.count).toBe(0);
    const input = container.querySelector('input');
    fireEvent.change(input, { target: { value: '88' } });
    expect(mockDispatch).toBeCalledTimes(1);
    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: 'change',
      payload: { speed: 88, configName: 'CUSTOM_PRESET_CONSTANT' },
    });
    expect(mockBatchCommand).toBeCalledTimes(1);
    expect(mockBatchCommand).lastCalledWith('Change speed');
    expect(batchCmd.count).toBe(1);
    expect(mockWriteData).toBeCalledTimes(4);
    expect(mockWriteData).toHaveBeenNthCalledWith(1, 'layer1', 'speed', 88, {
      applyPrinting: true,
      batchCmd,
    });
    expect(mockWriteData).toHaveBeenNthCalledWith(
      2,
      'layer1',
      'configName',
      'CUSTOM_PRESET_CONSTANT',
      { batchCmd }
    );
    expect(mockWriteData).toHaveBeenNthCalledWith(3, 'layer2', 'speed', 88, {
      applyPrinting: true,
      batchCmd,
    });
    expect(mockWriteData).toHaveBeenNthCalledWith(
      4,
      'layer2',
      'configName',
      'CUSTOM_PRESET_CONSTANT',
      { batchCmd }
    );
    expect(mockEmit).toBeCalledTimes(1);
    expect(mockEmit).toHaveBeenLastCalledWith('SET_ESTIMATED_TIME', null);
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toBeCalledTimes(1);
    expect(mockAddCommandToHistory).lastCalledWith(batchCmd);
  });

  test('onChange of value display should work correctly', () => {
    mockStorageGet.mockReturnValueOnce('mm');
    mockPrefRead.mockReturnValueOnce('fbm1').mockReturnValueOnce(true).mockReturnValueOnce(true);
    const { getByText } = render(
      <ConfigPanelContext.Provider
        value={{
          state: mockContextState as any,
          dispatch: mockDispatch,
          selectedLayers: mockSelectedLayers,
          initState: mockInitState,
        }}
      >
        <SpeedBlock type="modal" />
      </ConfigPanelContext.Provider>
    );
    expect(mockCreateEventEmitter).toBeCalledTimes(1);
    expect(mockCreateEventEmitter).toHaveBeenLastCalledWith('time-estimation-button');
    expect(getByText('type: modal')).toBeInTheDocument();

    expect(mockDispatch).not.toBeCalled();
    expect(mockWriteData).not.toBeCalled();
    expect(mockEmit).not.toBeCalled();
    fireEvent.click(getByText('MockConfigValueDisplayButton'));
    expect(mockDispatch).toBeCalledTimes(1);
    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: 'change',
      payload: { speed: 88, configName: 'CUSTOM_PRESET_CONSTANT' },
    });
    expect(mockWriteData).not.toBeCalled();
    expect(mockBatchCommand).not.toBeCalled();
  });
});
