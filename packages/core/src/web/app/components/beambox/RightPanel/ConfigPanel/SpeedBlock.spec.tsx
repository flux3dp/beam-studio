import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { setStorage } from '@mocks/@core/app/stores/storageStore';
import useLayerStore from '@core/app/stores/layer/layerStore';

const mockIsDev = jest.fn();

jest.mock(
  '@core/helpers/is-dev',
  () =>
    (...args) =>
      mockIsDev(...args),
);

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

const mockUseGlobalPreferenceStore = jest.fn();
const initialGlobalPreference = {
  'print-advanced-mode': false,
  vector_speed_constraint: true,
};
const mockGlobalPreference = { ...initialGlobalPreference };

jest.mock('@core/app/stores/globalPreferenceStore', () => ({
  useGlobalPreferenceStore: (...args) => mockUseGlobalPreferenceStore(...args),
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

const mockCreateEventEmitter = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: (...args) => mockCreateEventEmitter(...args),
}));

const mockEmit = jest.fn();

jest.mock('../contexts/ObjectPanelContext', () => ({
  ObjectPanelContext: React.createContext({ activeKey: null }),
}));

jest.mock('@core/helpers/layer/check-vector', () => jest.fn());

const mockInitState = jest.fn();

jest.mock('./initState', () => mockInitState);

import SpeedBlock from './SpeedBlock';

const mockCurveEngravingState = { hasData: false, maxAngle: 0 };

jest.mock('@core/app/stores/curveEngravingStore', () => ({
  useCurveEngravingStore: (selector?: (state: { hasData: boolean; maxAngle: number }) => unknown) =>
    selector ? selector(mockCurveEngravingState) : mockCurveEngravingState,
}));

const mockUseWorkarea = jest.fn();

jest.mock('@core/helpers/hooks/useWorkarea', () => () => mockUseWorkarea());

const mockGetAutoFeeder = jest.fn();

jest.mock('@core/helpers/addOn', () => ({
  getAutoFeeder: (...args) => mockGetAutoFeeder(...args),
}));

const mockUseConfigPanelStore = jest.fn();
const mockChange = jest.fn();

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: (...args) => mockUseConfigPanelStore(...args),
}));

describe('test SpeedBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLayerStore.setState({ hasVector: false, selectedLayers: ['layer1', 'layer2'] });
    mockCreateEventEmitter.mockReturnValueOnce({
      emit: mockEmit,
    });
    mockCurveEngravingState.hasData = false;
    setStorage('default-units', 'mm');
    mockUseWorkarea.mockReturnValue('fbm1');
    mockGetAutoFeeder.mockReturnValue(false);
    mockUseConfigPanelStore.mockReturnValue({
      change: mockChange,
      module: { hasMultiValue: false, value: LayerModule.LASER_10W_DIODE },
      speed: { hasMultiValue: false, value: 87 },
    });
    Object.assign(mockGlobalPreference, initialGlobalPreference);
    mockUseGlobalPreferenceStore.mockImplementation((selector) => {
      return selector(mockGlobalPreference);
    });
    mockIsDev.mockReturnValue(true);
  });

  it('should render correctly when unit is mm', () => {
    const { container } = render(<SpeedBlock />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when unit is inches', () => {
    setStorage('default-units', 'inches');

    const { container } = render(<SpeedBlock />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when type is panel-item', () => {
    const { container } = render(<SpeedBlock type="panel-item" />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when has vector warning', () => {
    useLayerStore.setState({ hasVector: true });

    const { container } = render(<SpeedBlock />);

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.warning')).toBeInTheDocument();
  });

  it('should render correctly when has curve engraving data', () => {
    mockUseWorkarea.mockReturnValue('fbb2');
    mockCurveEngravingState.hasData = true;

    const { container } = render(<SpeedBlock />);

    // Curve engraving limits maxValue but doesn't show a warning
    expect(container).toMatchSnapshot();
  });

  it('should render correctly when has auto feeder vector speed warning', () => {
    mockUseWorkarea.mockReturnValue('fbb2');
    mockGetAutoFeeder.mockReturnValue(true);
    mockGlobalPreference['print-advanced-mode'] = true;
    useLayerStore.setState({ hasVector: true });

    const { container } = render(<SpeedBlock />);

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.warning')).toBeInTheDocument();
  });

  it('should render correctly when has low speed warning', () => {
    mockUseWorkarea.mockReturnValue('fhexa1');
    useLayerStore.setState({ hasVector: true });

    mockUseConfigPanelStore.mockReturnValue({
      change: mockChange,
      module: { hasMultiValue: false, value: LayerModule.LASER_10W_DIODE },
      speed: { value: 1 },
    });

    const { container } = render(<SpeedBlock />);

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.warning')).toBeInTheDocument();
  });

  it('should render correctly when module is 4C', () => {
    mockIsDev.mockReturnValue(false);
    mockUseWorkarea.mockReturnValue('fbm2');

    mockUseConfigPanelStore.mockReturnValue({
      change: mockChange,
      module: { hasMultiValue: false, value: LayerModule.PRINTER_4C },
      speed: { value: 1 },
    });

    const { container } = render(<SpeedBlock />);

    expect(container).toMatchSnapshot();
  });

  test('onChange should work', () => {
    const { container } = render(<SpeedBlock />);

    expect(mockCreateEventEmitter).toHaveBeenCalledTimes(1);
    expect(mockCreateEventEmitter).toHaveBeenLastCalledWith('time-estimation-button');

    expect(mockChange).not.toHaveBeenCalled();
    expect(mockWriteData).not.toHaveBeenCalled();
    expect(mockEmit).not.toHaveBeenCalled();
    expect(mockBatchCommand).not.toHaveBeenCalled();
    expect(batchCmd.count).toBe(0);

    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: '88' } });
    expect(mockChange).toHaveBeenCalledTimes(1);
    expect(mockChange).toHaveBeenLastCalledWith({ configName: 'CUSTOM_PRESET_CONSTANT', speed: 88 });
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).lastCalledWith('Change speed');
    expect(batchCmd.count).toBe(1);
    expect(mockWriteData).toHaveBeenCalledTimes(4);
    expect(mockWriteData).toHaveBeenNthCalledWith(1, 'layer1', 'speed', 88, {
      applyPrinting: true,
      batchCmd,
    });
    expect(mockWriteData).toHaveBeenNthCalledWith(2, 'layer1', 'configName', 'CUSTOM_PRESET_CONSTANT', { batchCmd });
    expect(mockWriteData).toHaveBeenNthCalledWith(3, 'layer2', 'speed', 88, {
      applyPrinting: true,
      batchCmd,
    });
    expect(mockWriteData).toHaveBeenNthCalledWith(4, 'layer2', 'configName', 'CUSTOM_PRESET_CONSTANT', { batchCmd });
    expect(mockEmit).toHaveBeenCalledTimes(1);
    expect(mockEmit).toHaveBeenLastCalledWith('SET_ESTIMATED_TIME', null);
    expect(batchCmd.onAfter).toBe(mockInitState);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).lastCalledWith(batchCmd);
  });

  test('onChange of value display should work correctly', () => {
    const { getByText } = render(<SpeedBlock type="modal" />);

    expect(mockCreateEventEmitter).toHaveBeenCalledTimes(1);
    expect(mockCreateEventEmitter).toHaveBeenLastCalledWith('time-estimation-button');
    expect(getByText('type: modal')).toBeInTheDocument();

    expect(mockChange).not.toHaveBeenCalled();
    expect(mockWriteData).not.toHaveBeenCalled();
    expect(mockEmit).not.toHaveBeenCalled();
    fireEvent.click(getByText('MockConfigValueDisplayButton'));
    expect(mockChange).toHaveBeenCalledTimes(1);
    expect(mockChange).toHaveBeenLastCalledWith({ configName: 'CUSTOM_PRESET_CONSTANT', speed: 88 });
    expect(mockWriteData).not.toHaveBeenCalled();
    expect(mockBatchCommand).not.toHaveBeenCalled();
  });
});
