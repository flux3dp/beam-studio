/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { LayerPanelContext } from 'app/views/beambox/Right-Panels/contexts/LayerPanelContext';

import ConfigPanelContext from './ConfigPanelContext';

const mockWriteData = jest.fn();
jest.mock('helpers/layer/layer-config-helper', () => ({
  CUSTOM_PRESET_CONSTANT: 'CUSTOM_PRESET_CONSTANT',
  writeData: (...args) => mockWriteData(...args),
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
const mockContextState = { dottingTime: { value: 140, hasMultiValue: false } };
const mockDispatch = jest.fn();
const mockInitState = jest.fn();

jest.mock('app/views/beambox/Right-Panels/contexts/ObjectPanelContext', () => ({
  ObjectPanelContext: React.createContext({ activeKey: null }),
}));

jest.mock('app/views/beambox/Right-Panels/contexts/LayerPanelContext', () => ({
  LayerPanelContext: React.createContext({ hasGradient: false }),
}));

jest.mock(
  'app/widgets/Unit-Input-v2',
  () =>
    ({ id, min, max, unit, defaultValue, decimal, displayMultiValue, getValue }: any) =>
      (
        <div>
          MockUnitInput
          <p>min: {min}</p>
          <p>max: {max}</p>
          <p>unit: {unit}</p>
          <p>defaultValue: {defaultValue}</p>
          <p>decimal: {decimal}</p>
          <p>displayMultiValue: {displayMultiValue ? 'Y' : 'N'}</p>
          <input
            id={id}
            data-testid={id}
            type="number"
            value={defaultValue}
            onChange={(e) => getValue(parseFloat(e.target.value))}
          />
        </div>
      )
);

const mockCreateEventEmitter = jest.fn();
jest.mock('helpers/eventEmitterFactory', () => ({
  createEventEmitter: (...args) => mockCreateEventEmitter(...args),
}));
const mockEmit = jest.fn();

// eslint-disable-next-line import/first
import DottingTimeBlock from './DottingTimeBlock';

describe('test DottingTimeBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateEventEmitter.mockReturnValueOnce({
      emit: mockEmit,
    });
  });

  it('should render correctly when type is default', () => {
    const { container } = render(
      <LayerPanelContext.Provider value={{ hasGradient: true } as any}>
        <ConfigPanelContext.Provider
          value={{
            state: mockContextState as any,
            dispatch: mockDispatch,
            selectedLayers: mockSelectedLayers,
            initState: mockInitState,
          }}
        >
          <DottingTimeBlock />
        </ConfigPanelContext.Provider>
      </LayerPanelContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it('should render correctly when type is panel-item', () => {
    const { container } = render(
      <LayerPanelContext.Provider value={{ hasGradient: true } as any}>
        <ConfigPanelContext.Provider
          value={{
            state: mockContextState as any,
            dispatch: mockDispatch,
            selectedLayers: mockSelectedLayers,
            initState: mockInitState,
          }}
        >
          <DottingTimeBlock type="panel-item" />
        </ConfigPanelContext.Provider>
      </LayerPanelContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it('should render correctly when no gradient images in canvas', () => {
    const { container } = render(
      <LayerPanelContext.Provider value={{ hasGradient: false } as any}>
        <ConfigPanelContext.Provider
          value={{
            state: mockContextState as any,
            dispatch: mockDispatch,
            selectedLayers: mockSelectedLayers,
            initState: mockInitState,
          }}
        >
          <DottingTimeBlock />
        </ConfigPanelContext.Provider>
      </LayerPanelContext.Provider>
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('onChange should work', () => {
    const { container } = render(
      <LayerPanelContext.Provider value={{ hasGradient: true } as any}>
        <ConfigPanelContext.Provider
          value={{
            state: mockContextState as any,
            dispatch: mockDispatch,
            selectedLayers: mockSelectedLayers,
            initState: mockInitState,
          }}
        >
          <DottingTimeBlock />
        </ConfigPanelContext.Provider>
      </LayerPanelContext.Provider>
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
      payload: { dottingTime: 88, configName: 'CUSTOM_PRESET_CONSTANT' },
    });
    expect(mockBatchCommand).toBeCalledTimes(1);
    expect(mockBatchCommand).lastCalledWith('Change dotting time');
    expect(batchCmd.count).toBe(1);
    expect(mockWriteData).toBeCalledTimes(4);
    expect(mockWriteData).toHaveBeenNthCalledWith(1, 'layer1', 'dottingTime', 88, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(
      2,
      'layer1',
      'configName',
      'CUSTOM_PRESET_CONSTANT',
      { batchCmd }
    );
    expect(mockWriteData).toHaveBeenNthCalledWith(3, 'layer2', 'dottingTime', 88, { batchCmd });
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

  test('onChange should work correctly when type is modal', () => {
    const { container } = render(
      <LayerPanelContext.Provider value={{ hasGradient: true } as any}>
        <ConfigPanelContext.Provider
          value={{
            state: mockContextState as any,
            dispatch: mockDispatch,
            selectedLayers: mockSelectedLayers,
            initState: mockInitState,
          }}
        >
          <DottingTimeBlock type="modal" />
        </ConfigPanelContext.Provider>
      </LayerPanelContext.Provider>
    );
    expect(mockCreateEventEmitter).toBeCalledTimes(1);
    expect(mockCreateEventEmitter).toHaveBeenLastCalledWith('time-estimation-button');

    expect(mockDispatch).not.toBeCalled();
    expect(mockWriteData).not.toBeCalled();
    expect(mockEmit).not.toBeCalled();
    const input = container.querySelector('input');
    fireEvent.change(input, { target: { value: '88' } });
    expect(mockDispatch).toBeCalledTimes(1);
    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: 'change',
      payload: { dottingTime: 88, configName: 'CUSTOM_PRESET_CONSTANT' },
    });
    expect(mockWriteData).not.toBeCalled();
    expect(mockBatchCommand).not.toBeCalled();
  });
});
