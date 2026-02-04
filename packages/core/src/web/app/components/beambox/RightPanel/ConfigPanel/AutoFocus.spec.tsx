import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import MockNumberBlock from '@mocks/@core/app/components/beambox/RightPanel/ConfigPanel/NumberBlock';

jest.mock('./NumberBlock', () => MockNumberBlock);

const mockWriteData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  CUSTOM_PRESET_CONSTANT: 'CUSTOM_PRESET_CONSTANT',
  writeData: (...args: any) => mockWriteData(...args),
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

const mockSelectedLayers = ['layer1', 'layer2'];
const mockUseConfigPanelStore = jest.fn();
const mockChange = jest.fn();

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: (...args) => mockUseConfigPanelStore(...args),
}));

import AutoFocus from './AutoFocus';
import useLayerStore from '@core/app/stores/layer/layerStore';

describe('test AutoFocus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseConfigPanelStore.mockReturnValue({
      change: mockChange,
      height: { hasMultiValue: false, value: 3 },
      repeat: { hasMultiValue: false, value: 1 },
      zStep: { hasMultiValue: false, value: 0 },
    });
    useLayerStore.setState({ selectedLayers: mockSelectedLayers });
  });

  it('should render correctly when height is less than 0', () => {
    mockUseConfigPanelStore.mockReturnValue({
      change: mockChange,
      height: { hasMultiValue: false, value: -3 },
      repeat: { hasMultiValue: false, value: 1 },
      zStep: { hasMultiValue: false, value: 0 },
    });

    const { container, queryByText } = render(<AutoFocus />);

    expect(container).toMatchSnapshot();
    expect(queryByText('title: Object Height')).not.toBeInTheDocument();
    expect(queryByText('title: Z Step')).not.toBeInTheDocument();
  });

  it('should render correctly when repeat is less than 1', () => {
    const { container, queryByText } = render(<AutoFocus />);

    expect(container).toMatchSnapshot();
    expect(queryByText('title: Object Height')).toBeInTheDocument();
    expect(queryByText('title: Z Step')).not.toBeInTheDocument();
  });

  it('should render correctly when repeat is larger than 1', () => {
    mockUseConfigPanelStore.mockReturnValue({
      change: mockChange,
      height: { hasMultiValue: false, value: 3 },
      repeat: { hasMultiValue: false, value: 2 },
      zStep: { hasMultiValue: false, value: 0 },
    });

    const { container, queryByText } = render(<AutoFocus />);

    expect(container).toMatchSnapshot();
    expect(queryByText('title: Object Height')).toBeInTheDocument();
    expect(queryByText('title: Z Step')).toBeInTheDocument();
  });

  test('handlers should work', () => {
    mockUseConfigPanelStore.mockReturnValue({
      change: mockChange,
      height: { hasMultiValue: false, value: 3 },
      repeat: { hasMultiValue: false, value: 2 },
      zStep: { hasMultiValue: false, value: 0 },
    });

    const { container } = render(<AutoFocus />);

    expect(mockChange).not.toHaveBeenCalled();
    expect(mockWriteData).not.toHaveBeenCalled();
    expect(mockBatchCommand).not.toHaveBeenCalled();
    expect(batchCmd.count).toBe(0);
    fireEvent.click(container.querySelector('button#auto-focus'));
    expect(mockChange).toHaveBeenCalledTimes(1);
    expect(mockChange).toHaveBeenLastCalledWith({ height: -3 });
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
