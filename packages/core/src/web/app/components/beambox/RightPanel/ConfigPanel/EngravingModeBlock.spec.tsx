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

const mockWriteData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  CUSTOM_PRESET_CONSTANT: 'CUSTOM_PRESET_CONSTANT',
  writeData: (...args: unknown[]) => mockWriteData(...args),
}));

jest.mock('@core/helpers/useI18n', () => () => ({
  inner_engraving_settings: { engraving_mode: 'Engraving Mode', mode_dot: 'Dot', mode_line: 'Line' },
}));

jest.mock('@core/app/widgets/AntdSelect', () => ({ id, onChange, options, value }: any) => (
  <select id={id} onChange={(e) => onChange(e.target.value)} value={value}>
    <option value="-">-</option>
    {options.map((option: any) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
));

const mockUseConfigPanelStore = jest.fn();
const mockChange = jest.fn();

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: (...args: unknown[]) => mockUseConfigPanelStore(...args),
}));

import { useLayerStore } from '@core/app/stores/layer/layerStore';

import EngravingModeBlock from './EngravingModeBlock';

describe('EngravingModeBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLayerStore.setState({ selectedLayers: ['layer1', 'layer2'] });
    mockUseConfigPanelStore.mockReturnValue({ change: mockChange, stlMode: { hasMultiValue: false, value: 'dot' } });
  });

  test('switching the mode writes every selected layer as one step, and only the mode', () => {
    const { container } = render(<EngravingModeBlock />);

    fireEvent.change(container.querySelector('#stl-mode')!, { target: { value: 'line' } });

    expect(mockChange).toHaveBeenCalledWith({ configName: 'CUSTOM_PRESET_CONSTANT', stlMode: 'line' });
    expect(mockWriteData).toHaveBeenCalledTimes(4);
    expect(mockWriteData).toHaveBeenCalledWith('layer1', 'stlMode', 'line', { batchCmd });
    expect(mockWriteData).toHaveBeenCalledWith('layer2', 'stlMode', 'line', { batchCmd });
    expect(mockWriteData).toHaveBeenCalledWith('layer1', 'configName', 'CUSTOM_PRESET_CONSTANT', { batchCmd });
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
  });

  test('choosing the current mode does nothing', () => {
    const { container } = render(<EngravingModeBlock />);

    fireEvent.change(container.querySelector('#stl-mode')!, { target: { value: 'dot' } });

    expect(mockChange).not.toHaveBeenCalled();
    expect(mockWriteData).not.toHaveBeenCalled();
  });

  test('renders before the panel state has the mode, as dot', () => {
    mockUseConfigPanelStore.mockReturnValue({ change: mockChange });

    const { container } = render(<EngravingModeBlock />);

    expect(container.querySelector('#stl-mode')).toHaveValue('dot');
  });

  test('in a modal it only updates the panel state', () => {
    const { container } = render(<EngravingModeBlock type="modal" />);

    fireEvent.change(container.querySelector('#stl-mode')!, { target: { value: 'line' } });

    expect(mockChange).toHaveBeenCalledTimes(1);
    expect(mockWriteData).not.toHaveBeenCalled();
  });
});
