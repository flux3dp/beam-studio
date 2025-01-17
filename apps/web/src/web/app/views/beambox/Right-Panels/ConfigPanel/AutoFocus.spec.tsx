/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import ConfigPanelContext from './ConfigPanelContext';

jest.mock('helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      laser_panel: {
        focus_adjustment: 'focus_adjustment',
        height: 'height',
        z_step: 'z_step',
      },
    },
  },
}));

jest.mock(
  'app/widgets/Unit-Input-v2',
  () =>
    ({ id, min, max, unit, defaultValue, decimal, displayMultiValue, getValue }: any) =>
      (
        <div>
          MockUnitInput
          <p>id: {id}</p>
          <p>min: {min}</p>
          <p>max: {max}</p>
          <p>unit: {unit}</p>
          <p>defaultValue: {defaultValue}</p>
          <p>decimal: {decimal}</p>
          <p>displayMultiValue: {displayMultiValue}</p>
          <button type="button" onClick={() => getValue(7)}>
            change-{id}
          </button>
        </div>
      )
);

const mockWriteData = jest.fn();
jest.mock('helpers/layer/layer-config-helper', () => ({
  CUSTOM_PRESET_CONSTANT: 'CUSTOM_PRESET_CONSTANT',
  writeData: (...args: any) => mockWriteData(...args),
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
  height: { value: 3, hasMultiValue: false },
  repeat: { value: 1, hasMultiValue: false },
  zStep: { value: 0, hasMultiValue: false },
};
const mockDispatch = jest.fn();
const mockInitState = jest.fn();

// eslint-disable-next-line import/first
import AutoFocus from './AutoFocus';

describe('test AutoFocus', () => {
  it('should render correctly when height is less than 0', () => {
    const state = {
      ...mockContextState,
      height: { value: -3 },
    } as any;
    const { container, queryByText } = render(
      <ConfigPanelContext.Provider
        value={{
          selectedLayers: mockSelectedLayers,
          state,
          dispatch: mockDispatch,
          initState: mockInitState,
        }}
      >
        <AutoFocus />
      </ConfigPanelContext.Provider>
    );
    expect(container).toMatchSnapshot();
    expect(queryByText('height')).not.toBeInTheDocument();
    expect(queryByText('z_step')).not.toBeInTheDocument();
  });

  it('should render correctly when repeat is less than 1', () => {
    const state = {
      ...mockContextState,
    } as any;
    const { container, queryByText } = render(
      <ConfigPanelContext.Provider
        value={{
          selectedLayers: mockSelectedLayers,
          state,
          dispatch: mockDispatch,
          initState: mockInitState,
        }}
      >
        <AutoFocus />
      </ConfigPanelContext.Provider>
    );
    expect(container).toMatchSnapshot();
    expect(queryByText('height')).toBeInTheDocument();
    expect(queryByText('z_step')).not.toBeInTheDocument();
  });

  it('should render correctly when repeat is larger than 1', () => {
    const state = {
      ...mockContextState,
      repeat: { value: 2 },
    } as any;
    const { container, queryByText } = render(
      <ConfigPanelContext.Provider
        value={{
          selectedLayers: mockSelectedLayers,
          state,
          dispatch: mockDispatch,
          initState: mockInitState,
        }}
      >
        <AutoFocus />
      </ConfigPanelContext.Provider>
    );
    expect(container).toMatchSnapshot();
    expect(queryByText('height')).toBeInTheDocument();
    expect(queryByText('z_step')).toBeInTheDocument();
  });

  test('handlers should work', () => {
    const state = {
      ...mockContextState,
      repeat: { value: 2 },
    } as any;
    const { container, getByText } = render(
      <ConfigPanelContext.Provider
        value={{
          selectedLayers: mockSelectedLayers,
          state,
          dispatch: mockDispatch,
          initState: mockInitState,
        }}
      >
        <AutoFocus />
      </ConfigPanelContext.Provider>
    );
    expect(mockDispatch).not.toBeCalled();
    expect(mockWriteData).not.toBeCalled();
    expect(mockBatchCommand).not.toBeCalled();
    expect(batchCmd.count).toBe(0);
    fireEvent.click(container.querySelector('button#auto-focus'));
    expect(mockDispatch).toBeCalledTimes(1);
    expect(mockDispatch).lastCalledWith({ type: 'change', payload: { height: -3 } });
    expect(mockBatchCommand).toBeCalledTimes(1);
    expect(mockBatchCommand).lastCalledWith('Change auto focus toggle');
    expect(batchCmd.count).toBe(1);
    expect(mockWriteData).toBeCalledTimes(2);
    expect(mockWriteData).toHaveBeenNthCalledWith(1, 'layer1', 'height', -3, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(2, 'layer2', 'height', -3, { batchCmd });
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toBeCalledTimes(1);
    expect(mockAddCommandToHistory).lastCalledWith(batchCmd);

    fireEvent.click(getByText('change-height'));
    expect(mockDispatch).toBeCalledTimes(2);
    expect(mockDispatch).lastCalledWith({ type: 'change', payload: { height: 7 } });
    expect(mockBatchCommand).toBeCalledTimes(2);
    expect(mockBatchCommand).lastCalledWith('Change auto focus height');
    expect(batchCmd.count).toBe(2);
    expect(mockWriteData).toBeCalledTimes(4);
    expect(mockWriteData).toHaveBeenNthCalledWith(3, 'layer1', 'height', 7, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(4, 'layer2', 'height', 7, { batchCmd });
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toBeCalledTimes(2);
    expect(mockAddCommandToHistory).lastCalledWith(batchCmd);

    fireEvent.click(getByText('change-z_step'));
    expect(mockDispatch).toBeCalledTimes(3);
    expect(mockDispatch).lastCalledWith({
      type: 'change',
      payload: { zStep: 7, configName: 'CUSTOM_PRESET_CONSTANT' },
    });
    expect(mockBatchCommand).toBeCalledTimes(3);
    expect(mockBatchCommand).lastCalledWith('Change auto focus z step');
    expect(batchCmd.count).toBe(3);
    expect(mockWriteData).toBeCalledTimes(8);
    expect(mockWriteData).toHaveBeenNthCalledWith(5, 'layer1', 'zStep', 7, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(
      6,
      'layer1',
      'configName',
      'CUSTOM_PRESET_CONSTANT',
      { batchCmd }
    );
    expect(mockWriteData).toHaveBeenNthCalledWith(7, 'layer2', 'zStep', 7, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(
      8,
      'layer2',
      'configName',
      'CUSTOM_PRESET_CONSTANT',
      { batchCmd }
    );
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toBeCalledTimes(3);
    expect(mockAddCommandToHistory).lastCalledWith(batchCmd);
  });
});
