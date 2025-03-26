import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import ConfigPanelContext from './ConfigPanelContext';

import MockNumberBlock from '@mocks/@core/app/views/beambox/Right-Panels/ConfigPanel/NumberBlock';

jest.mock('./NumberBlock', () => MockNumberBlock);

const mockWriteData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  CUSTOM_PRESET_CONSTANT: 'CUSTOM_PRESET_CONSTANT',
  writeData: (...args: any) => mockWriteData(...args),
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
  height: { hasMultiValue: false, value: 3 },
  repeat: { hasMultiValue: false, value: 1 },
  zStep: { hasMultiValue: false, value: 0 },
};
const mockDispatch = jest.fn();
const mockInitState = jest.fn();

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
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state,
        }}
      >
        <AutoFocus />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    expect(queryByText('title: Object Height')).not.toBeInTheDocument();
    expect(queryByText('title: Z Step')).not.toBeInTheDocument();
  });

  it('should render correctly when repeat is less than 1', () => {
    const state = {
      ...mockContextState,
    } as any;
    const { container, queryByText } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state,
        }}
      >
        <AutoFocus />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    expect(queryByText('title: Object Height')).toBeInTheDocument();
    expect(queryByText('title: Z Step')).not.toBeInTheDocument();
  });

  it('should render correctly when repeat is larger than 1', () => {
    const state = {
      ...mockContextState,
      repeat: { value: 2 },
    } as any;
    const { container, queryByText } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state,
        }}
      >
        <AutoFocus />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    expect(queryByText('title: Object Height')).toBeInTheDocument();
    expect(queryByText('title: Z Step')).toBeInTheDocument();
  });

  test('handlers should work', () => {
    const state = {
      ...mockContextState,
      repeat: { value: 2 },
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
        <AutoFocus />
      </ConfigPanelContext.Provider>,
    );

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockWriteData).not.toHaveBeenCalled();
    expect(mockBatchCommand).not.toHaveBeenCalled();
    expect(batchCmd.count).toBe(0);
    fireEvent.click(container.querySelector('button#auto-focus'));
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenLastCalledWith({ payload: { height: -3 }, type: 'change' });
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenLastCalledWith('Change auto focus toggle');
    expect(batchCmd.count).toBe(1);
    expect(mockWriteData).toHaveBeenCalledTimes(2);
    expect(mockWriteData).toHaveBeenNthCalledWith(1, 'layer1', 'height', -3, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(2, 'layer2', 'height', -3, { batchCmd });
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenLastCalledWith(batchCmd);
  });
});
