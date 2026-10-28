import React from 'react';

import { fireEvent, render } from '@testing-library/react';

let batchCmd = { onAfter: undefined };

jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: jest.fn().mockImplementation(() => {
    batchCmd = { onAfter: undefined };

    return batchCmd;
  }),
}));

const mockInitState = jest.fn();

jest.mock('./initState', () => mockInitState);

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args: unknown[]) => mockAddCommandToHistory(...args),
}));

const mockGetSelectedLayers = jest.fn();

jest.mock('@core/app/svgedit/layer/layerManager', () => ({
  getSelectedLayers: () => mockGetSelectedLayers(),
}));

const mockWriteData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  CUSTOM_PRESET_CONSTANT: 'CUSTOM_PRESET_CONSTANT',
  writeData: (...args: unknown[]) => mockWriteData(...args),
}));

const mockEmit = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: () => ({ emit: mockEmit }),
}));

const mockUseConfigPanelStore = jest.fn();
const mockChange = jest.fn();

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: (...args: unknown[]) => mockUseConfigPanelStore(...args),
}));

import SolidBlock from './SolidBlock';

describe('SolidBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSelectedLayers.mockReturnValue(['layer1', 'layer2']);
    mockUseConfigPanelStore.mockReturnValue({ change: mockChange, stlSolid: { hasMultiValue: false, value: false } });
  });

  test('toggling writes every selected layer as one step', () => {
    const { container } = render(<SolidBlock />);

    fireEvent.click(container.querySelector('#stl_solid')!);

    expect(mockChange).toHaveBeenCalledWith({ configName: 'CUSTOM_PRESET_CONSTANT', stlSolid: true });
    expect(mockWriteData).toHaveBeenCalledWith('layer1', 'stlSolid', true, { batchCmd });
    expect(mockWriteData).toHaveBeenCalledWith('layer2', 'stlSolid', true, { batchCmd });
    expect(mockWriteData).toHaveBeenCalledWith('layer1', 'configName', 'CUSTOM_PRESET_CONSTANT', { batchCmd });
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenCalledWith('SET_ESTIMATED_TIME', null);
  });

  test('renders before the panel state has the value, as off', () => {
    mockUseConfigPanelStore.mockReturnValue({ change: mockChange });

    const { container } = render(<SolidBlock />);

    expect(container.querySelector('#stl_solid')).toHaveAttribute('aria-checked', 'false');
  });

  test('in a modal it only updates the panel state', () => {
    const { container } = render(<SolidBlock type="modal" />);

    fireEvent.click(container.querySelector('#stl_solid')!);

    expect(mockChange).toHaveBeenCalledTimes(1);
    expect(mockWriteData).not.toHaveBeenCalled();
  });
});
