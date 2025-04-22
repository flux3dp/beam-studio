import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import { LayerPanelContext } from '@core/app/views/beambox/Right-Panels/contexts/LayerPanelContext';

import ConfigPanelContext from './ConfigPanelContext';

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

jest.mock('@core/app/views/beambox/Right-Panels/ObjectPanelItem', () => ({
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

const mockStorageGet = jest.fn();

jest.mock('@core/implementations/storage', () => ({
  get: (...args) => mockStorageGet(...args),
}));

const mockPrefRead = jest.fn();

jest.mock('@core/app/actions/beambox/beambox-preference', () => ({
  read: (...args) => mockPrefRead(...args),
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

jest.mock('@core/app/views/beambox/Right-Panels/contexts/LayerPanelContext', () => ({
  LayerPanelContext: React.createContext({ hasVector: false }),
}));

jest.mock('@core/app/views/beambox/Right-Panels/contexts/ObjectPanelContext', () => ({
  ObjectPanelContext: React.createContext({ activeKey: null }),
}));

jest.mock('@core/helpers/layer/check-vector', () => jest.fn());

const mockInitState = jest.fn();

jest.mock('./initState', () => mockInitState);

import SpeedBlock from './SpeedBlock';

const mockUseHasCurveEngraving = jest.fn();

jest.mock('@core/helpers/hooks/useHasCurveEngraving', () => () => mockUseHasCurveEngraving());

const mockUseWorkarea = jest.fn();

jest.mock('@core/helpers/hooks/useWorkarea', () => () => mockUseWorkarea());

const mockUseBeamboxPreference = jest.fn();

jest.mock('@core/helpers/hooks/useBeamboxPreference', () => ({
  useBeamboxPreference: (key) => mockUseBeamboxPreference(key),
}));

const mockGetAutoFeeder = jest.fn();

jest.mock('@core/helpers/addOn', () => ({
  getAutoFeeder: (...args) => mockGetAutoFeeder(...args),
}));

const mockSelectedLayers = ['layer1', 'layer2'];
const mockUseConfigPanelStore = jest.fn();
const mockChange = jest.fn();

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: (...args) => mockUseConfigPanelStore(...args),
}));

describe('test SpeedBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateEventEmitter.mockReturnValueOnce({
      emit: mockEmit,
    });
    mockUseHasCurveEngraving.mockReturnValue(false);
    mockStorageGet.mockReturnValue('mm');
    mockPrefRead.mockReturnValueOnce(true).mockReturnValueOnce(true);
    mockUseWorkarea.mockReturnValue('fbm1');
    mockGetAutoFeeder.mockReturnValue(false);
    mockUseBeamboxPreference.mockReturnValue(false);
    mockUseConfigPanelStore.mockReturnValue({
      change: mockChange,
      module: { hasMultiValue: false, value: LayerModule.LASER_10W_DIODE },
      speed: { hasMultiValue: false, value: 87 },
    });
  });

  it('should render correctly when unit is mm', () => {
    const { container } = render(
      <ConfigPanelContext.Provider value={{ selectedLayers: mockSelectedLayers }}>
        <SpeedBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(mockStorageGet).toHaveBeenCalledTimes(1);
    expect(mockStorageGet).toHaveBeenLastCalledWith('default-units');
    expect(mockPrefRead).toHaveBeenCalledTimes(2);
    expect(mockPrefRead).toHaveBeenNthCalledWith(1, 'curve_engraving_speed_limit');
    expect(mockPrefRead).toHaveBeenNthCalledWith(2, 'vector_speed_constraint');
    expect(container).toMatchSnapshot();
  });

  it('should render correctly when unit is inches', () => {
    mockStorageGet.mockReturnValueOnce('inches');

    const { container } = render(
      <ConfigPanelContext.Provider value={{ selectedLayers: mockSelectedLayers }}>
        <SpeedBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when type is panel-item', () => {
    const { container } = render(
      <ConfigPanelContext.Provider value={{ selectedLayers: mockSelectedLayers }}>
        <SpeedBlock type="panel-item" />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when has vector warning', () => {
    const { container } = render(
      <LayerPanelContext.Provider value={{ hasVector: true } as any}>
        <ConfigPanelContext.Provider value={{ selectedLayers: mockSelectedLayers }}>
          <SpeedBlock />
        </ConfigPanelContext.Provider>
      </LayerPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.warning')).toBeInTheDocument();
  });

  it('should render correctly when has curve engraving warning', () => {
    mockUseWorkarea.mockReturnValue('fbb2');
    mockUseHasCurveEngraving.mockReturnValue(true);

    const { container } = render(
      <ConfigPanelContext.Provider value={{ selectedLayers: mockSelectedLayers }}>
        <SpeedBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.warning')).toBeInTheDocument();
  });

  it('should render correctly when has auto feeder vector speed warning', () => {
    mockUseWorkarea.mockReturnValue('fbb2');
    mockGetAutoFeeder.mockReturnValue(true);
    mockUseBeamboxPreference.mockReturnValue(true);

    const { container } = render(
      <LayerPanelContext.Provider value={{ hasVector: true } as any}>
        <ConfigPanelContext.Provider value={{ selectedLayers: mockSelectedLayers }}>
          <SpeedBlock />
        </ConfigPanelContext.Provider>
      </LayerPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.warning')).toBeInTheDocument();
  });

  it('should render correctly when has low speed warning', () => {
    mockUseWorkarea.mockReturnValue('fhexa1');

    mockUseConfigPanelStore.mockReturnValue({
      change: mockChange,
      module: { hasMultiValue: false, value: LayerModule.LASER_10W_DIODE },
      speed: { value: 1 },
    });

    const { container } = render(
      <LayerPanelContext.Provider value={{ hasVector: true } as any}>
        <ConfigPanelContext.Provider value={{ selectedLayers: mockSelectedLayers }}>
          <SpeedBlock />
        </ConfigPanelContext.Provider>
      </LayerPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.warning')).toBeInTheDocument();
  });

  test('onChange should work', () => {
    const { container } = render(
      <ConfigPanelContext.Provider value={{ selectedLayers: mockSelectedLayers }}>
        <SpeedBlock />
      </ConfigPanelContext.Provider>,
    );

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
    const { getByText } = render(
      <ConfigPanelContext.Provider value={{ selectedLayers: mockSelectedLayers }}>
        <SpeedBlock type="modal" />
      </ConfigPanelContext.Provider>,
    );

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
