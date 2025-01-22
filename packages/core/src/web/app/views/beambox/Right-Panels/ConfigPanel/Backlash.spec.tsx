import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import ConfigPanelContext from './ConfigPanelContext';

jest.mock('@core/helpers/useI18n', () => () => ({
  beambox: {
    right_panel: {
      laser_panel: {
        backlash: 'backlash',
      },
    },
  },
}));

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
        <button onClick={() => onChange(8.8)} type="button">
          MockConfigValueDisplayButton
        </button>
      </div>
    ),
);

const mockWriteData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  writeData: (...args) => mockWriteData(...args),
}));

const mockStorage = jest.fn();

jest.mock('@app/implementations/storage', () => ({
  get: (key) => mockStorage(key),
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
  backlash: { hasMultiValue: false, value: 8.7 },
};
const mockDispatch = jest.fn();
const mockInitState = jest.fn();

import Backlash from './Backlash';

describe('test Backlash', () => {
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
        <Backlash />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  test('onChange should work', () => {
    const { getByText } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <Backlash />
      </ConfigPanelContext.Provider>,
    );

    expect(mockDispatch).not.toBeCalled();
    expect(mockWriteData).not.toBeCalled();
    expect(mockBatchCommand).not.toBeCalled();
    expect(batchCmd.count).toBe(0);
    fireEvent.click(getByText('MockConfigValueDisplayButton'));
    expect(mockDispatch).toBeCalledTimes(1);
    expect(mockDispatch).toHaveBeenLastCalledWith({
      payload: { backlash: 8.8 },
      type: 'change',
    });
    expect(mockBatchCommand).toBeCalledTimes(1);
    expect(mockBatchCommand).lastCalledWith('Change backlash');
    expect(batchCmd.count).toBe(1);
    expect(mockWriteData).toBeCalledTimes(2);
    expect(mockWriteData).toHaveBeenNthCalledWith(1, 'layer1', 'backlash', 8.8, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(2, 'layer2', 'backlash', 8.8, { batchCmd });
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toBeCalledTimes(1);
    expect(mockAddCommandToHistory).lastCalledWith(batchCmd);
  });
});
