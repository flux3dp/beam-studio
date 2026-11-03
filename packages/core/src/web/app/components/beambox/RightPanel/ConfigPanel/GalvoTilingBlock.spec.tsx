import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const mockChange = jest.fn();
let mockData = { hasMultiValue: false, value: 'grid' };

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: (selector) => selector({ change: mockChange, galvoTiling: mockData }),
}));

let batchCmd = { onAfter: undefined };
const mockBatchCommand = jest.fn().mockImplementation(() => {
  batchCmd = { onAfter: undefined };

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
  writeData: (...args) => mockWriteData(...args),
}));

const mockInitState = jest.fn();

jest.mock('./initState', () => mockInitState);

const mockGetSelectedLayers = jest.fn();

jest.mock('@core/app/svgedit/layer/layerManager', () => ({
  getSelectedLayers: () => mockGetSelectedLayers(),
}));

import GalvoTilingBlock from './GalvoTilingBlock';

const pick = (container: HTMLElement, getByText: (text: string) => HTMLElement, label: string) => {
  fireEvent.mouseDown(container.querySelector('.ant-select-selector')!);
  fireEvent.click(getByText(label));
};

describe('test GalvoTilingBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockData = { hasMultiValue: false, value: 'grid' };
    mockGetSelectedLayers.mockReturnValue(['layer1', 'layer2']);
  });

  it('writes the choice to every selected layer', () => {
    const { container, getByText } = render(<GalvoTilingBlock />);

    expect(getByText('Grid')).toBeInTheDocument();
    pick(container, getByText, 'By Object');

    expect(mockChange).toHaveBeenCalledWith({ galvoTiling: 'object' });
    expect(mockWriteData).toHaveBeenCalledTimes(2);
    expect(mockWriteData).toHaveBeenNthCalledWith(1, 'layer1', 'galvoTiling', 'object', { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(2, 'layer2', 'galvoTiling', 'object', { batchCmd });
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toHaveBeenCalledWith(batchCmd);
    expect(mockEmit).toHaveBeenCalledWith('SET_ESTIMATED_TIME', null);
  });

  it('leaves the layers to the modal to write', () => {
    const { container, getByText } = render(<GalvoTilingBlock type="modal" />);

    pick(container, getByText, 'By Object');

    expect(mockChange).toHaveBeenCalledWith({ galvoTiling: 'object' });
    expect(mockWriteData).not.toHaveBeenCalled();
    expect(mockAddCommandToHistory).not.toHaveBeenCalled();
  });

  it('shows no value for layers that differ', () => {
    mockData = { hasMultiValue: true, value: 'grid' };

    const { container, queryByText } = render(<GalvoTilingBlock />);

    expect(queryByText('Grid')).toBeNull();
    expect(container.querySelector('.ant-select-selection-placeholder')).toHaveTextContent('-');
  });
});
