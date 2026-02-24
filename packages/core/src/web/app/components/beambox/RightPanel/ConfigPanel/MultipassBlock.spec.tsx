import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import useLayerStore from '@core/app/stores/layer/layerStore';
import { ObjectPanelContext } from '../contexts/ObjectPanelContext';

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
        <button onClick={() => onChange(10)} type="button">
          MockConfigValueDisplayButton
        </button>
      </div>
    ),
);

jest.mock('../contexts/ObjectPanelContext', () => ({
  ObjectPanelContext: React.createContext({ activeKey: null }),
}));

jest.mock('../ObjectPanelItem', () => ({
  Item: ({ content, id, label, onClick }: any) => (
    <div onClick={onClick}>
      MockObjectPanelItem
      <div>id: {id}</div>
      <div>content: {content}</div>
      <div>label: {label}</div>
    </div>
  ),
}));

const mockWriteData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  CUSTOM_PRESET_CONSTANT: 'CUSTOM_PRESET_CONSTANT',
  writeData: (...args) => mockWriteData(...args),
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

const mockCreateEventEmitter = jest.fn();
const mockEmit = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: (...args) => mockCreateEventEmitter(...args),
}));

const mockInitState = jest.fn();

jest.mock('./initState', () => mockInitState);

import MultipassBlock from './MultipassBlock';

const mockUseConfigPanelStore = jest.fn();
const mockChange = jest.fn();

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: (...args) => mockUseConfigPanelStore(...args),
}));

const mockUseGlobalPreferenceStore = jest.fn();

jest.mock('@core/app/stores/globalPreferenceStore', () => ({
  useGlobalPreferenceStore: (...args) => mockUseGlobalPreferenceStore(...args),
}));

describe('test MultipassBlock when type is not panel-item', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLayerStore.setState({ selectedLayers: ['layer1', 'layer2'] });
    mockCreateEventEmitter.mockReturnValueOnce({
      emit: mockEmit,
    });
    batchCmd = { count: 0, onAfter: undefined };

    mockUseConfigPanelStore.mockReturnValue({
      change: mockChange,
      multipass: { hasMultiValue: false, value: 8 },
    });
    mockUseGlobalPreferenceStore.mockReturnValue(false);
  });

  it('should render correctly', () => {
    const { container } = render(<MultipassBlock />);

    expect(container).toMatchSnapshot();
  });

  test('edit value with slider', () => {
    const { container } = render(<MultipassBlock />);

    expect(mockChange).not.toHaveBeenCalled();
    expect(mockWriteData).not.toHaveBeenCalled();
    expect(mockBatchCommand).not.toHaveBeenCalled();
    expect(batchCmd.count).toBe(0);

    const slider = container.querySelector('.mock-config-slider');

    fireEvent.change(slider, { target: { value: 7 } });
    expect(mockChange).toHaveBeenCalledTimes(1);
    expect(mockChange).toHaveBeenLastCalledWith({ configName: 'CUSTOM_PRESET_CONSTANT', multipass: 7 });
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenLastCalledWith('Change multipass');
    expect(batchCmd.count).toBe(1);
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenLastCalledWith('SET_ESTIMATED_TIME', null);
    expect(mockWriteData).toHaveBeenCalledTimes(4);
    expect(mockWriteData).toHaveBeenNthCalledWith(1, 'layer1', 'multipass', 7, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(2, 'layer1', 'configName', 'CUSTOM_PRESET_CONSTANT', { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(3, 'layer2', 'multipass', 7, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(4, 'layer2', 'configName', 'CUSTOM_PRESET_CONSTANT', { batchCmd });
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenLastCalledWith(batchCmd);
  });

  test('edit value with value display', () => {
    const { getByText } = render(<MultipassBlock />);

    expect(mockChange).not.toHaveBeenCalled();
    expect(mockWriteData).not.toHaveBeenCalled();
    expect(mockBatchCommand).not.toHaveBeenCalled();
    expect(batchCmd.count).toBe(0);

    const button = getByText('MockConfigValueDisplayButton');

    fireEvent.click(button);
    expect(mockChange).toHaveBeenCalledTimes(1);
    expect(mockChange).toHaveBeenLastCalledWith({ configName: 'CUSTOM_PRESET_CONSTANT', multipass: 10 });
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenLastCalledWith('SET_ESTIMATED_TIME', null);
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenLastCalledWith('Change multipass');
    expect(batchCmd.count).toBe(1);
    expect(mockWriteData).toHaveBeenCalledTimes(4);
    expect(mockWriteData).toHaveBeenNthCalledWith(1, 'layer1', 'multipass', 10, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(2, 'layer1', 'configName', 'CUSTOM_PRESET_CONSTANT', { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(3, 'layer2', 'multipass', 10, { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(4, 'layer2', 'configName', 'CUSTOM_PRESET_CONSTANT', { batchCmd });
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenLastCalledWith(batchCmd);
  });
});

describe('test MultipassBlock when type is panel-item', () => {
  it('should render correctly when visible', () => {
    const { container } = render(
      <ObjectPanelContext value={{ activeKey: 'multipass' } as any}>
        <MultipassBlock type="panel-item" />
      </ObjectPanelContext>,
    );

    expect(container).toMatchSnapshot();
  });
});
