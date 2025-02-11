import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import ConfigPanelContext from './ConfigPanelContext';

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
          change-{id}
        </button>
      </div>
    ),
);

const mockWriteData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  writeData: (...args: any) => mockWriteData(...args),
}));

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: mockAddCommandToHistory,
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
  wobbleDiameter: { hasMultiValue: false, value: 0.2 },
  wobbleStep: { hasMultiValue: false, value: 0.05 },
};
const mockDispatch = jest.fn();
const mockInitState = jest.fn();

import WobbleBlock from './WobbleBlock';

describe('test WobbleBlock', () => {
  it('should render correctly when wobbleDiameter is less than 0', () => {
    const state = {
      ...mockContextState,
      wobbleDiameter: { value: -1 },
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
        <WobbleBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when wobbleStep is less than 0', () => {
    const state = {
      ...mockContextState,
      wobbleStep: { value: -1 },
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
        <WobbleBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when toggle is on', () => {
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <WobbleBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  test('handlers should work', () => {
    const { container, getByText } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <WobbleBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(mockDispatch).not.toBeCalled();
    expect(mockWriteData).not.toBeCalled();
    expect(mockBatchCommand).not.toBeCalled();
    expect(batchCmd.count).toBe(0);
    fireEvent.click(container.querySelector('button#wobble'));
    expect(mockDispatch).toBeCalledTimes(1);
    expect(mockDispatch).lastCalledWith({
      payload: { wobbleDiameter: -0.2, wobbleStep: -0.05 },
      type: 'change',
    });
    expect(mockBatchCommand).toBeCalledTimes(1);
    expect(mockBatchCommand).lastCalledWith('Change wobble toggle');
    expect(batchCmd.count).toBe(1);
    expect(mockWriteData).toBeCalledTimes(4);
    expect(mockWriteData).toHaveBeenNthCalledWith(1, 'layer1', 'wobbleStep', -0.05, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(2, 'layer1', 'wobbleDiameter', -0.2, {
      batchCmd,
    });
    expect(mockWriteData).toHaveBeenNthCalledWith(3, 'layer2', 'wobbleStep', -0.05, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(4, 'layer2', 'wobbleDiameter', -0.2, {
      batchCmd,
    });
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toBeCalledTimes(1);
    expect(mockAddCommandToHistory).lastCalledWith(batchCmd);

    fireEvent.click(getByText('change-wobble_step'));
    expect(mockDispatch).toBeCalledTimes(2);
    expect(mockDispatch).lastCalledWith({ payload: { wobbleStep: 7 }, type: 'change' });
    expect(mockBatchCommand).toBeCalledTimes(2);
    expect(mockBatchCommand).lastCalledWith('Change wobbleStep');
    expect(batchCmd.count).toBe(2);
    expect(mockWriteData).toBeCalledTimes(6);
    expect(mockWriteData).toHaveBeenNthCalledWith(5, 'layer1', 'wobbleStep', 7, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(6, 'layer2', 'wobbleStep', 7, { batchCmd });
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toBeCalledTimes(2);
    expect(mockAddCommandToHistory).lastCalledWith(batchCmd);

    fireEvent.click(getByText('change-wobble_diameter'));
    expect(mockDispatch).toBeCalledTimes(3);
    expect(mockDispatch).lastCalledWith({ payload: { wobbleDiameter: 7 }, type: 'change' });
    expect(mockBatchCommand).toBeCalledTimes(3);
    expect(mockBatchCommand).lastCalledWith('Change wobbleDiameter');
    expect(batchCmd.count).toBe(3);
    expect(mockWriteData).toBeCalledTimes(8);
    expect(mockWriteData).toHaveBeenNthCalledWith(7, 'layer1', 'wobbleDiameter', 7, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(8, 'layer2', 'wobbleDiameter', 7, { batchCmd });
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toBeCalledTimes(3);
    expect(mockAddCommandToHistory).lastCalledWith(batchCmd);
  });
});
