import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import ConfigPanelContext from './ConfigPanelContext';

let batchCmd = { count: 0, onAfter: undefined };
const mockBatchCommand = jest.fn().mockImplementation(() => {
  batchCmd = { count: batchCmd.count + 1, onAfter: undefined };

  return batchCmd;
});

jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: mockBatchCommand,
}));

import CurveEngravingZHighSpeed from './CurveEngravingZHighSpeed';

const mockWriteData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  CUSTOM_PRESET_CONSTANT: 'CUSTOM_PRESET_CONSTANT',
  writeData: (...args) => mockWriteData(...args),
}));

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
}));

const mockSelectedLayers = ['layer1', 'layer2'];
const mockContextState = {
  ceZSpeedLimit: { hasMultiValue: false, value: 140 },
};
const mockDispatch = jest.fn();
const mockInitState = jest.fn();

describe('test CurveEngravingZHighSpeed', () => {
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
        <CurveEngravingZHighSpeed />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when high speed is enabled', () => {
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: {
            ceZSpeedLimit: { hasMultiValue: true, value: 300 },
          } as any,
        }}
      >
        <CurveEngravingZHighSpeed />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  test('onToggle should work', () => {
    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <CurveEngravingZHighSpeed />
      </ConfigPanelContext.Provider>,
    );
    const btn = container.querySelector('button#curve-engraving-z-high-speed');

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockWriteData).not.toHaveBeenCalled();
    expect(mockBatchCommand).not.toHaveBeenCalled();
    expect(batchCmd.count).toBe(0);
    fireEvent.click(btn);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenLastCalledWith({
      payload: { ceZSpeedLimit: 300 },
      type: 'change',
    });
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenLastCalledWith('Change curve engraving z speed limit');
    expect(batchCmd.count).toBe(1);
    expect(mockWriteData).toHaveBeenCalledTimes(2);
    expect(mockWriteData).toHaveBeenNthCalledWith(1, 'layer1', 'ceZSpeedLimit', 300, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(2, 'layer2', 'ceZSpeedLimit', 300, { batchCmd });
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenLastCalledWith(batchCmd);
  });
});
