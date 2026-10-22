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

import FillCapsBlock from './FillCapsBlock';

describe('FillCapsBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSelectedLayers.mockReturnValue(['layer1', 'layer2']);
    mockUseConfigPanelStore.mockReturnValue({
      change: mockChange,
      stlFillCaps: { hasMultiValue: false, value: false },
    });
  });

  test('toggling writes every selected layer as one step', () => {
    const { container } = render(<FillCapsBlock />);

    fireEvent.click(container.querySelector('#stl_fill_caps')!);

    // not part of a preset: the layer keeps its preset name
    expect(mockChange).toHaveBeenCalledWith({ stlFillCaps: true });
    expect(mockWriteData).toHaveBeenCalledWith('layer1', 'stlFillCaps', true, { batchCmd });
    expect(mockWriteData).toHaveBeenCalledWith('layer2', 'stlFillCaps', true, { batchCmd });
    expect(mockWriteData).toHaveBeenCalledTimes(2);
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenCalledWith('SET_ESTIMATED_TIME', null);
  });

  test('renders before the panel state has the value, as off', () => {
    mockUseConfigPanelStore.mockReturnValue({ change: mockChange });

    const { container } = render(<FillCapsBlock />);

    expect(container.querySelector('#stl_fill_caps')).toHaveAttribute('aria-checked', 'false');
  });

  test('in a modal it only updates the panel state', () => {
    const { container } = render(<FillCapsBlock type="modal" />);

    fireEvent.click(container.querySelector('#stl_fill_caps')!);

    expect(mockChange).toHaveBeenCalledTimes(1);
    expect(mockWriteData).not.toHaveBeenCalled();
  });
});
