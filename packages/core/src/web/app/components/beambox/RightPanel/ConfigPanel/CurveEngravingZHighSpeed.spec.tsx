import React from 'react';
import { fireEvent, render } from '@testing-library/react';

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

import CurveEngravingZHighSpeed from './CurveEngravingZHighSpeed';
import useLayerStore from '@core/app/stores/layer/layerStore';

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
const mockUseConfigPanelStore = jest.fn();
const mockChange = jest.fn();

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: (...args) => mockUseConfigPanelStore(...args),
}));

describe('test CurveEngravingZHighSpeed', () => {
  beforeEach(() => {
    mockUseConfigPanelStore.mockReturnValue({
      ceZHighSpeed: { hasMultiValue: false, value: false },
      change: mockChange,
    });
    useLayerStore.setState({ selectedLayers: mockSelectedLayers });
  });

  it('should render correctly', () => {
    const { container } = render(<CurveEngravingZHighSpeed />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when high speed is enabled', () => {
    mockUseConfigPanelStore.mockReturnValue({
      ceZHighSpeed: { hasMultiValue: true, value: true },
      change: mockChange,
    });

    const { container } = render(<CurveEngravingZHighSpeed />);

    expect(container).toMatchSnapshot();
  });

  test('onToggle should work', () => {
    const { container } = render(<CurveEngravingZHighSpeed />);
    const btn = container.querySelector('button#curve-engraving-z-high-speed');

    expect(mockChange).not.toHaveBeenCalled();
    expect(mockWriteData).not.toHaveBeenCalled();
    expect(mockBatchCommand).not.toHaveBeenCalled();
    expect(batchCmd.count).toBe(0);
    fireEvent.click(btn);
    expect(mockChange).toHaveBeenCalledTimes(1);
    expect(mockChange).toHaveBeenLastCalledWith({ ceZHighSpeed: true });
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenLastCalledWith('Change curve engraving z speed limit');
    expect(batchCmd.count).toBe(1);
    expect(mockWriteData).toHaveBeenCalledTimes(2);
    expect(mockWriteData).toHaveBeenNthCalledWith(1, 'layer1', 'ceZHighSpeed', true, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(2, 'layer2', 'ceZHighSpeed', true, { batchCmd });
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenLastCalledWith(batchCmd);
  });
});
