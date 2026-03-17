import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import useLayerStore from '@core/app/stores/layer/layerStore';

const mockChange = jest.fn();
let mockData = { hasMultiValue: false, value: false };

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: () => ({
    change: mockChange,
    highQuality: mockData,
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

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: mockAddCommandToHistory,
}));

const mockEmit = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: () => ({ emit: mockEmit }),
}));

const mockWriteData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  writeData: mockWriteData,
}));

const mockInitState = jest.fn();

jest.mock('./initState', () => mockInitState);

import HighQualityBlock from './HighQualityBlock';

describe('test HighQualityBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    batchCmd = { count: 0, onAfter: undefined };
    mockData = { hasMultiValue: false, value: false };
    useLayerStore.setState({ selectedLayers: ['layer1', 'layer2'] });
  });

  it('should render correctly', () => {
    const { container } = render(<HighQualityBlock />);

    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('#high_quality'));
    expect(mockChange).toHaveBeenCalledTimes(1);
    expect(mockChange).toHaveBeenNthCalledWith(1, { highQuality: true });
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenLastCalledWith('SET_ESTIMATED_TIME', null);
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenLastCalledWith('Toggle high quality');
    expect(mockWriteData).toHaveBeenCalledTimes(2);
    expect(mockWriteData).toHaveBeenNthCalledWith(1, 'layer1', 'highQuality', true, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(2, 'layer2', 'highQuality', true, { batchCmd });
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, batchCmd);
    expect(batchCmd.onAfter).toBe(mockInitState);
  });

  it('should render correctly with multi-value', () => {
    mockData = { hasMultiValue: true, value: true };

    const { container } = render(<HighQualityBlock />);

    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('#high_quality'));
    expect(mockChange).toHaveBeenCalledTimes(1);
    expect(mockChange).toHaveBeenNthCalledWith(1, { highQuality: false });
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenLastCalledWith('SET_ESTIMATED_TIME', null);
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenLastCalledWith('Toggle high quality');
    expect(mockWriteData).toHaveBeenCalledTimes(2);
    expect(mockWriteData).toHaveBeenNthCalledWith(1, 'layer1', 'highQuality', false, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(2, 'layer2', 'highQuality', false, { batchCmd });
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, batchCmd);
    expect(batchCmd.onAfter).toBe(mockInitState);
  });

  it('should render correctly when type is panel-item', () => {
    const { container } = render(<HighQualityBlock type="panel-item" />);

    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('#high_quality'));
    expect(mockChange).toHaveBeenCalledTimes(1);
    expect(mockChange).toHaveBeenNthCalledWith(1, { highQuality: true });
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenLastCalledWith('SET_ESTIMATED_TIME', null);
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenLastCalledWith('Toggle high quality');
    expect(mockWriteData).toHaveBeenCalledTimes(2);
    expect(mockWriteData).toHaveBeenNthCalledWith(1, 'layer1', 'highQuality', true, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(2, 'layer2', 'highQuality', true, { batchCmd });
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, batchCmd);
    expect(batchCmd.onAfter).toBe(mockInitState);
  });

  it('should render correctly when type is modal', () => {
    const { container } = render(<HighQualityBlock type="modal" />);

    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('#high_quality'));
    expect(mockChange).toHaveBeenCalledTimes(1);
    expect(mockChange).toHaveBeenNthCalledWith(1, { highQuality: true });
    expect(mockEmit).not.toHaveBeenCalled();
    expect(mockBatchCommand).not.toHaveBeenCalled();
    expect(mockWriteData).not.toHaveBeenCalled();
    expect(mockAddCommandToHistory).not.toHaveBeenCalled();
  });
});
