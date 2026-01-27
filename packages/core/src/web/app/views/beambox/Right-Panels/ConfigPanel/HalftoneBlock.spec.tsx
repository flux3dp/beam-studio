import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import i18n from '@core/helpers/i18n';

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

import HalftoneBlock from './HalftoneBlock';
import useLayerStore from '@core/app/stores/layer/layerStore';

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
}));

const mockWriteData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  CUSTOM_PRESET_CONSTANT: 'CUSTOM_PRESET_CONSTANT',
  writeData: (...args) => mockWriteData(...args),
}));

const mockOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: (...args) => mockOpen(...args),
}));

jest.mock('@core/app/widgets/AntdSelect', () => {
  const Select = ({ className, onChange, options, value }: any) => (
    <select className={className} onChange={(e) => onChange(Number(e.target.value))} value={value}>
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  return Select;
});

const mockUseConfigPanelStore = jest.fn();
const mockChange = jest.fn();

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: (...args) => mockUseConfigPanelStore(...args),
}));

describe('test HalftoneBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    batchCmd = { count: 0, onAfter: undefined };
    mockUseConfigPanelStore.mockReturnValue({
      change: mockChange,
      halftone: { hasMultiValue: false, value: 1 },
    });
    useLayerStore.setState({ selectedLayers: ['layer1', 'layer2'] });
  });

  it('should render correctly', () => {
    const { container } = render(<HalftoneBlock />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when type is panel-item', () => {
    const { container } = render(<HalftoneBlock type="panel-item" />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when type is modal', () => {
    const { container } = render(<HalftoneBlock type="modal" />);

    expect(container).toMatchSnapshot();
  });

  it('should change halftone value', () => {
    const { container } = render(<HalftoneBlock />);
    const select = container.querySelector('select');

    fireEvent.change(select, { target: { value: '2' } });
    expect(mockChange).toHaveBeenCalledTimes(1);
    expect(mockChange).toHaveBeenNthCalledWith(1, { halftone: 2 });
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenLastCalledWith('Change Halftone');
    expect(mockWriteData).toHaveBeenCalledTimes(2);
    expect(mockWriteData).toHaveBeenNthCalledWith(1, 'layer1', 'halftone', 2, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(2, 'layer2', 'halftone', 2, { batchCmd });
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenLastCalledWith(batchCmd);

    const img = container.querySelector('[aria-label="question-circle"]');

    expect(mockOpen).not.toHaveBeenCalled();
    fireEvent.click(img);
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenLastCalledWith(i18n.lang.beambox.right_panel.laser_panel.halftone_link);
  });
});
