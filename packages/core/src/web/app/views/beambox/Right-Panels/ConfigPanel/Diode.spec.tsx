import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import ConfigPanelContext from './ConfigPanelContext';

const mockWriteData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  CUSTOM_PRESET_CONSTANT: 'CUSTOM_PRESET_CONSTANT',
  writeData: (...args) => mockWriteData(...args),
}));

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({ addCommandToHistory: mockAddCommandToHistory }));

let batchCmd = { count: 0, onAfter: undefined };
const mockBatchCommand = jest.fn().mockImplementation(() => {
  batchCmd = { count: batchCmd.count + 1, onAfter: undefined };

  return batchCmd;
});

jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: mockBatchCommand,
}));

const mockInitState = jest.fn();

jest.mock('./initState', () => mockInitState);

import Diode from './Diode';

const mockSelectedLayers = ['layer1', 'layer2'];
const mockUseConfigPanelStore = jest.fn();
const mockChange = jest.fn();

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: (...args) => mockUseConfigPanelStore(...args),
}));

describe('test Diode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseConfigPanelStore.mockReturnValue({
      change: mockChange,
      diode: { hasMultiValue: false, value: 1 },
    });
  });

  it('should render correctly', () => {
    const { container } = render(
      <ConfigPanelContext.Provider value={{ selectedLayers: mockSelectedLayers }}>
        <Diode />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  test('onToggle should work', () => {
    const { container } = render(
      <ConfigPanelContext.Provider value={{ selectedLayers: mockSelectedLayers }}>
        <Diode />
      </ConfigPanelContext.Provider>,
    );
    const btn = container.querySelector('button#diode');

    expect(mockChange).not.toHaveBeenCalled();
    expect(mockWriteData).not.toHaveBeenCalled();
    expect(mockBatchCommand).not.toHaveBeenCalled();
    expect(batchCmd.count).toBe(0);
    fireEvent.click(btn);
    expect(mockChange).toHaveBeenCalledTimes(1);
    expect(mockChange).toHaveBeenLastCalledWith({ diode: 0 });
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenLastCalledWith('Change diode toggle');
    expect(batchCmd.count).toBe(1);
    expect(mockWriteData).toHaveBeenCalledTimes(2);
    expect(mockWriteData).toHaveBeenNthCalledWith(1, 'layer1', 'diode', 0, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(2, 'layer2', 'diode', 0, { batchCmd });
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenLastCalledWith(batchCmd);
  });
});
