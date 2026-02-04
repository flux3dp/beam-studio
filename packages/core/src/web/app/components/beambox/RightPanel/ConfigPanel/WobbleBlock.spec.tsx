import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import MockNumberBlock from '@mocks/@core/app/components/beambox/RightPanel/ConfigPanel/NumberBlock';

jest.mock('./NumberBlock', () => MockNumberBlock);

import useLayerStore from '@core/app/stores/layer/layerStore';

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

const mockInitState = jest.fn();

jest.mock('./initState', () => mockInitState);

import WobbleBlock from './WobbleBlock';

const mockUseConfigPanelStore = jest.fn();
const mockChange = jest.fn();

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: (...args) => mockUseConfigPanelStore(...args),
}));

describe('test WobbleBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLayerStore.setState({ selectedLayers: ['layer1', 'layer2'] });
    mockUseConfigPanelStore.mockReturnValue({
      change: mockChange,
      wobbleDiameter: { hasMultiValue: false, value: 0.2 },
      wobbleStep: { hasMultiValue: false, value: 0.05 },
    });
  });

  it('should render correctly when wobbleDiameter is less than 0', () => {
    mockUseConfigPanelStore.mockReturnValue({
      change: mockChange,
      wobbleDiameter: { hasMultiValue: false, value: -1 },
      wobbleStep: { hasMultiValue: false, value: 0.05 },
    });

    const { container } = render(<WobbleBlock />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when wobbleStep is less than 0', () => {
    mockUseConfigPanelStore.mockReturnValue({
      change: mockChange,
      wobbleDiameter: { hasMultiValue: false, value: 0.2 },
      wobbleStep: { hasMultiValue: false, value: -1 },
    });

    const { container } = render(<WobbleBlock />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when toggle is on', () => {
    const { container } = render(<WobbleBlock />);

    expect(container).toMatchSnapshot();
  });

  test('handlers should work', () => {
    const { container } = render(<WobbleBlock />);

    expect(mockChange).not.toHaveBeenCalled();
    expect(mockWriteData).not.toHaveBeenCalled();
    expect(mockBatchCommand).not.toHaveBeenCalled();
    expect(batchCmd.count).toBe(0);
    fireEvent.click(container.querySelector('button#wobble'));
    expect(mockChange).toHaveBeenCalledTimes(1);
    expect(mockChange).toHaveBeenLastCalledWith({ wobbleDiameter: -0.2, wobbleStep: -0.05 });
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenLastCalledWith('Change wobble toggle');
    expect(batchCmd.count).toBe(1);
    expect(mockWriteData).toHaveBeenCalledTimes(4);
    expect(mockWriteData).toHaveBeenNthCalledWith(1, 'layer1', 'wobbleStep', -0.05, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(2, 'layer1', 'wobbleDiameter', -0.2, {
      batchCmd,
    });
    expect(mockWriteData).toHaveBeenNthCalledWith(3, 'layer2', 'wobbleStep', -0.05, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(4, 'layer2', 'wobbleDiameter', -0.2, {
      batchCmd,
    });
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenLastCalledWith(batchCmd);
  });
});
