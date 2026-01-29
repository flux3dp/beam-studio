import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import useLayerStore from '@core/app/stores/layer/layerStore';

jest.mock('./AdvancedPowerPanel', () => ({ onClose }: any) => (
  <div id="AdvancedPowerPanel">
    MockAdvancedPowerPanel
    <button onClick={onClose} type="button">
      AdvancedPowerPanelClose
    </button>
  </div>
));

jest.mock('./ConfigSlider', () => ({ id, max, min, onChange, value }: any) => (
  <input
    className="mock-config-slider"
    id={id}
    max={max}
    min={min}
    onChange={(e) => onChange(Number(e.target.value))}
    step={0.1}
    type="range"
    value={value}
  />
));

jest.mock(
  './ConfigValueDisplay',
  () =>
    ({
      decimal = 0,
      hasMultiValue = false,
      inputId,
      max,
      min,
      onChange,
      options,
      type = 'default',
      unit,
      value,
    }: any) => (
      <div>
        MockConfigValueDisplay
        <p>inputId: {inputId}</p>
        <p>type: {type}</p>
        <p>max: {max}</p>
        <p>min: {min}</p>
        <p>value: {value}</p>
        <p>unit: {unit}</p>
        <p>hasMultiValue: {hasMultiValue}</p>
        <p>decimal: {decimal}</p>
        <p>options: {JSON.stringify(options)}</p>
        <button onClick={() => onChange(88)} type="button">
          MockConfigValueDisplayButton
        </button>
      </div>
    ),
);

const mockGetLayerByName = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getLayerByName: (...args) => mockGetLayerByName(...args),
}));

const mockGetData = jest.fn();
const mockGetMultiSelectData = jest.fn();
const mockWriteDataLayer = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  CUSTOM_PRESET_CONSTANT: 'CUSTOM_PRESET_CONSTANT',
  getData: (...args) => mockGetData(...args),
  getMultiSelectData: (...args) => mockGetMultiSelectData(...args),
  writeDataLayer: (...args) => mockWriteDataLayer(...args),
}));

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
}));

let batchCmd = { count: 0, onAfter: undefined };
const mockBatchCommand = jest.fn().mockImplementation(() => {
  batchCmd = { count: batchCmd.count + 1, onAfter: undefined };

  return batchCmd;
});

jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: mockBatchCommand,
}));

const mockCheckPwmImages = jest.fn();

jest.mock(
  '@core/helpers/layer/check-pwm-images',
  () =>
    (...args) =>
      mockCheckPwmImages(...args),
);

const mockEventsOn = jest.fn();
const mockEventsOff = jest.fn();

jest.mock('@core/app/views/beambox/Right-Panels/contexts/ObjectPanelController', () => ({
  events: {
    off: mockEventsOff,
    on: mockEventsOn,
  },
}));

const mockInitState = jest.fn();

jest.mock('./initState', () => mockInitState);

const mockGetCurrentLayerName = jest.fn();

jest.mock('@core/app/svgedit/layer/layerManager', () => ({
  getCurrentLayerName: (...args) => mockGetCurrentLayerName(...args),
}));

import PowerBlock from './PowerBlock';

const mockUseConfigPanelStore = jest.fn();
const mockChange = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: (...args) => mockUseConfigPanelStore(...args),
}));

describe('test PowerBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLayerStore.setState({ selectedLayers: ['layer1', 'layer2'] });
    mockUseConfigPanelStore.mockReturnValue({
      change: mockChange,
      power: { hasMultiValue: false, value: 87 },
      update: mockUpdate,
    });
    mockCheckPwmImages.mockReturnValue(false);
    mockGetLayerByName.mockImplementation((name) => name);
    mockGetData.mockReturnValue(0);
    mockGetCurrentLayerName.mockReturnValue('layer1');
    batchCmd = { count: 0, onAfter: undefined };
  });

  it('should render correctly', () => {
    const { container, unmount } = render(<PowerBlock />);

    expect(container).toMatchSnapshot();
    expect(mockEventsOn).toHaveBeenCalledTimes(1);
    expect(mockEventsOn).toHaveBeenLastCalledWith('pwm-changed', expect.any(Function));
    unmount();
    expect(mockEventsOff).toHaveBeenCalledTimes(1);
    expect(mockEventsOff).toHaveBeenLastCalledWith('pwm-changed', expect.any(Function));
  });

  it('should render correctly when type is panel-item', () => {
    const { container } = render(<PowerBlock type="panel-item" />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly whe power is low', () => {
    mockUseConfigPanelStore.mockReturnValue({
      change: mockChange,
      power: { value: 7 },
      update: mockUpdate,
    });

    const { container } = render(<PowerBlock />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when hasPwmImages is true', () => {
    mockCheckPwmImages.mockReturnValue(true);

    const { container, getByText } = render(<PowerBlock />);
    const icon = container.querySelector('.icon');

    expect(icon).not.toBeNull();
    fireEvent.click(icon);
    expect(getByText('MockAdvancedPowerPanel')).toBeInTheDocument();
  });

  test('onChange should work', () => {
    const { container } = render(<PowerBlock />);

    expect(mockChange).not.toHaveBeenCalled();
    expect(mockWriteDataLayer).not.toHaveBeenCalled();
    expect(mockBatchCommand).not.toHaveBeenCalled();
    expect(batchCmd.count).toBe(0);

    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: '88' } });
    expect(mockChange).toHaveBeenCalledTimes(1);
    expect(mockChange).toHaveBeenLastCalledWith({ configName: 'CUSTOM_PRESET_CONSTANT', power: 88 });
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenLastCalledWith('Change power');
    expect(batchCmd.count).toBe(1);
    expect(mockGetLayerByName).toHaveBeenCalledTimes(2);
    expect(mockGetLayerByName).toHaveBeenNthCalledWith(1, 'layer1');
    expect(mockGetLayerByName).toHaveBeenNthCalledWith(2, 'layer2');
    expect(mockWriteDataLayer).toHaveBeenCalledTimes(4);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(1, 'layer1', 'power', 88, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(2, 'layer1', 'configName', 'CUSTOM_PRESET_CONSTANT', {
      batchCmd,
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(3, 'layer2', 'power', 88, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(4, 'layer2', 'configName', 'CUSTOM_PRESET_CONSTANT', {
      batchCmd,
    });
    expect(mockGetData).toHaveBeenCalledTimes(2);
    expect(mockGetData).toHaveBeenNthCalledWith(1, 'layer1', 'minPower');
    expect(mockGetData).toHaveBeenNthCalledWith(2, 'layer2', 'minPower');
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenLastCalledWith(batchCmd);
  });

  test('change power to less than minPower should work', () => {
    mockGetData.mockReturnValue(88);

    const { container } = render(<PowerBlock />);

    expect(mockChange).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockWriteDataLayer).not.toHaveBeenCalled();
    expect(mockBatchCommand).not.toHaveBeenCalled();
    expect(batchCmd.count).toBe(0);
    mockGetMultiSelectData.mockReturnValue({ value: 0 });

    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: '86' } });
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenLastCalledWith('Change power');
    expect(batchCmd.count).toBe(1);
    expect(mockGetLayerByName).toHaveBeenCalledTimes(2);
    expect(mockGetLayerByName).toHaveBeenNthCalledWith(1, 'layer1');
    expect(mockGetLayerByName).toHaveBeenNthCalledWith(2, 'layer2');
    expect(mockWriteDataLayer).toHaveBeenCalledTimes(6);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(1, 'layer1', 'power', 86, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(2, 'layer1', 'configName', 'CUSTOM_PRESET_CONSTANT', {
      batchCmd,
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(3, 'layer1', 'minPower', 0, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(4, 'layer2', 'power', 86, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(5, 'layer2', 'configName', 'CUSTOM_PRESET_CONSTANT', {
      batchCmd,
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(6, 'layer2', 'minPower', 0, { batchCmd });
    expect(mockGetData).toHaveBeenCalledTimes(2);
    expect(mockGetData).toHaveBeenNthCalledWith(1, 'layer1', 'minPower');
    expect(mockGetData).toHaveBeenNthCalledWith(2, 'layer2', 'minPower');
    expect(mockGetMultiSelectData).toHaveBeenCalledTimes(1);
    expect(mockGetMultiSelectData).toHaveBeenLastCalledWith(['layer1', 'layer2'], 0, 'minPower');
    expect(mockChange).toHaveBeenCalledTimes(1);
    expect(mockChange).toHaveBeenLastCalledWith({ configName: 'CUSTOM_PRESET_CONSTANT', power: 86 });
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenLastCalledWith({ minPower: { value: 0 } });
  });

  test('onChange of value display should work correctly', () => {
    const { getByText } = render(<PowerBlock type="modal" />);

    expect(getByText('type: modal')).toBeInTheDocument();
    expect(mockChange).not.toHaveBeenCalled();
    expect(mockWriteDataLayer).not.toHaveBeenCalled();
    fireEvent.click(getByText('MockConfigValueDisplayButton'));
    expect(mockChange).toHaveBeenCalledTimes(1);
    expect(mockChange).toHaveBeenLastCalledWith({ configName: 'CUSTOM_PRESET_CONSTANT', power: 88 });
    expect(mockWriteDataLayer).not.toHaveBeenCalled();
    expect(mockBatchCommand).not.toHaveBeenCalled();
  });
});
