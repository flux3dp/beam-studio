import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import ConfigPanelContext from './ConfigPanelContext';

jest.mock('@core/helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      laser_panel: {
        repeat: 'repeat',
        times: 'times',
      },
    },
  },
}));

jest.mock(
  '@core/app/widgets/Unit-Input-v2',
  () =>
    ({ decimal, defaultValue, displayMultiValue, getValue, id, max, min, unit }: any) => (
      <div>
        MockUnitInput
        <p>id: {id}</p>
        <p>min: {min}</p>
        <p>max: {max}</p>
        <p>unit: {unit}</p>
        <p>defaultValue: {defaultValue}</p>
        <p>decimal: {decimal}</p>
        <p>displayMultiValue: {displayMultiValue}</p>
        <button onClick={() => getValue(7)} type="button">
          change
        </button>
      </div>
    ),
);

jest.mock('@core/app/views/beambox/Right-Panels/ObjectPanelItem', () => ({
  Number: ({ decimal, id, label, unit, value }: any) => (
    <div>
      MockObjectPanelNumber
      <div>id: {id}</div>
      <div>value: {value}</div>
      <div>label: {label}</div>
      <div>unit: {unit}</div>
      <div>decimal: {decimal}</div>
    </div>
  ),
}));

const mockWriteData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  CUSTOM_PRESET_CONSTANT: 'CUSTOM_PRESET_CONSTANT',
  writeData: (...args) => mockWriteData(...args),
}));

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) =>
    callback({
      Canvas: {
        addCommandToHistory: mockAddCommandToHistory,
      },
    }),
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
  repeat: { hasMultiValue: false, value: 3 },
};
const mockDispatch = jest.fn();
const mockInitState = jest.fn();

const mockCreateEventEmitter = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: (...args) => mockCreateEventEmitter(...args),
}));

const mockEmit = jest.fn();

import RepeatBlock from './RepeatBlock';

describe('test RepeatBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateEventEmitter.mockReturnValueOnce({
      emit: mockEmit,
    });
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
        <RepeatBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
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
        <RepeatBlock type="panel-item" />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  test('onChange should work', () => {
    expect(mockCreateEventEmitter).not.toBeCalled();

    const { getByText } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <RepeatBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(mockCreateEventEmitter).toBeCalledTimes(1);
    expect(mockCreateEventEmitter).toHaveBeenLastCalledWith('time-estimation-button');

    expect(mockDispatch).not.toBeCalled();
    expect(mockWriteData).not.toBeCalled();
    expect(mockEmit).not.toBeCalled();
    expect(mockBatchCommand).not.toBeCalled();
    expect(batchCmd.count).toBe(0);
    fireEvent.click(getByText('change'));
    expect(mockDispatch).toBeCalledTimes(1);
    expect(mockDispatch).toHaveBeenLastCalledWith({
      payload: { configName: 'CUSTOM_PRESET_CONSTANT', repeat: 7 },
      type: 'change',
    });
    expect(mockBatchCommand).toBeCalledTimes(1);
    expect(mockBatchCommand).lastCalledWith('Change repeat');
    expect(batchCmd.count).toBe(1);
    expect(mockWriteData).toBeCalledTimes(4);
    expect(mockWriteData).toHaveBeenNthCalledWith(1, 'layer1', 'repeat', 7, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(2, 'layer1', 'configName', 'CUSTOM_PRESET_CONSTANT', { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(3, 'layer2', 'repeat', 7, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(4, 'layer2', 'configName', 'CUSTOM_PRESET_CONSTANT', { batchCmd });
    expect(mockEmit).toBeCalledTimes(1);
    expect(mockEmit).toHaveBeenLastCalledWith('SET_ESTIMATED_TIME', null);
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toBeCalledTimes(1);
    expect(mockAddCommandToHistory).lastCalledWith(batchCmd);
  });

  test('onChange should work correctly when type is modal', () => {
    expect(mockCreateEventEmitter).not.toBeCalled();

    const { getByText } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <RepeatBlock type="modal" />
      </ConfigPanelContext.Provider>,
    );

    expect(mockCreateEventEmitter).toBeCalledTimes(1);
    expect(mockCreateEventEmitter).toHaveBeenLastCalledWith('time-estimation-button');

    expect(mockDispatch).not.toBeCalled();
    expect(mockWriteData).not.toBeCalled();
    expect(mockEmit).not.toBeCalled();
    fireEvent.click(getByText('change'));
    expect(mockDispatch).toBeCalledTimes(1);
    expect(mockDispatch).toHaveBeenLastCalledWith({
      payload: { configName: 'CUSTOM_PRESET_CONSTANT', repeat: 7 },
      type: 'change',
    });
    expect(mockWriteData).not.toBeCalled();
    expect(mockBatchCommand).not.toBeCalled();
  });
});
