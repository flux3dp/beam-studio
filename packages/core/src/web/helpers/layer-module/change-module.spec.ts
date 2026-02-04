import { LayerModule } from '@core/app/constants/layer-module/layer-modules';

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: mockPopUp,
}));

const mockTogglePresprayArea = jest.fn();

jest.mock('@core/app/actions/canvas/prespray-area', () => ({
  togglePresprayArea: mockTogglePresprayArea,
}));

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: { getState: () => ({ workarea: 'ado1' }) },
}));

let batchCmd = null;
const mockBatchCommand = jest.fn().mockImplementation(() => {
  batchCmd = { addSubCommand: jest.fn(), onAfter: null };

  return batchCmd;
});

jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: mockBatchCommand,
}));

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/app/svgedit/history/undoManager', () => ({
  addCommandToHistory: mockAddCommandToHistory,
}));

const mockInitState = jest.fn();

jest.mock('@core/app/components/beambox/RightPanel/ConfigPanel/initState', () => mockInitState);

const mockAlertConfigRead = jest.fn();
const mockAlertConfigWrite = jest.fn();

jest.mock('@core/helpers/api/alert-config', () => ({
  read: mockAlertConfigRead,
  write: mockAlertConfigWrite,
}));

const mockToggleFullColorLayer = jest.fn();

jest.mock('@core/helpers/layer/full-color/toggleFullColorLayer', () => mockToggleFullColorLayer);

const mockApplyPreset = jest.fn();
const mockWriteDataLayer = jest.fn();
const mockGetData = jest.fn().mockReturnValue('configName');

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  applyPreset: mockApplyPreset,
  baseConfig: {
    ink: 3,
    multipass: 3,
    printingSpeed: 60,
    speed: 20,
    strength: 15,
  },
  getData: mockGetData,
  moduleBaseConfig: {
    [LayerModule.PRINTER]: {
      multipass: 5,
    },
  },
  writeDataLayer: mockWriteDataLayer,
}));

const mockGetPresetsList = jest.fn();

jest.mock('@core/helpers/presets/preset-helper', () => ({
  getPresetsList: mockGetPresetsList,
}));

import { changeLayersModule } from './change-module';
import { mockForceUpdate } from '@mocks/@core/app/stores/layer/layerStore';

const mockLayer = {} as unknown as Element;

describe('test changeLayersModule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAlertConfigRead.mockReturnValue(false);
    mockToggleFullColorLayer.mockReturnValue({ isEmpty: () => false });
    mockGetData.mockReturnValue('config1');
    mockGetPresetsList.mockReturnValue([]);
  });

  test('change to 20w with different preset', () => {
    mockGetPresetsList
      .mockReturnValueOnce([{ name: 'config1', power: 88, repeat: 89, speed: 87 }])
      .mockReturnValue([{ name: 'config1', power: 78, repeat: 79, speed: 77 }]);

    changeLayersModule([mockLayer], LayerModule.LASER_10W_DIODE, LayerModule.LASER_20W_DIODE, { addToHistory: true });
    expect(mockGetPresetsList).toHaveBeenCalledTimes(2);
    expect(mockGetPresetsList).toHaveBeenNthCalledWith(1, 'ado1', LayerModule.LASER_10W_DIODE);
    expect(mockGetPresetsList).toHaveBeenNthCalledWith(2, 'ado1', LayerModule.LASER_20W_DIODE);
    expect(mockGetData).toHaveBeenCalledTimes(2);
    expect(mockGetData).toHaveBeenNthCalledWith(1, mockLayer, 'configName');
    expect(mockWriteDataLayer).toHaveBeenCalledTimes(1);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(1, mockLayer, 'module', LayerModule.LASER_20W_DIODE, {
      batchCmd,
    });
    expect(mockApplyPreset).toHaveBeenCalledTimes(1);
    expect(mockApplyPreset).toHaveBeenNthCalledWith(
      1,
      mockLayer,
      { name: 'config1', power: 78, repeat: 79, speed: 77 },
      { batchCmd },
    );
    expect(mockToggleFullColorLayer).toHaveBeenCalledTimes(1);
    expect(mockToggleFullColorLayer).toHaveBeenNthCalledWith(1, mockLayer, { val: false });
    expect(batchCmd.addSubCommand).toHaveBeenCalledTimes(1);
    expect(mockInitState).toHaveBeenCalledTimes(1);
    expect(mockForceUpdate).toHaveBeenCalledTimes(1);
    expect(mockTogglePresprayArea).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, batchCmd);

    batchCmd.onAfter();
    expect(mockInitState).toHaveBeenCalledTimes(2);
    expect(mockForceUpdate).toHaveBeenCalledTimes(2);
    expect(mockTogglePresprayArea).toHaveBeenCalledTimes(2);
  });

  test('change to 20w with same preset', () => {
    const mockPresetList = [{ name: 'config1', power: 88, repeat: 89, speed: 87 }];

    mockGetPresetsList.mockReturnValue(mockPresetList);
    changeLayersModule([mockLayer], LayerModule.LASER_10W_DIODE, LayerModule.LASER_20W_DIODE, { addToHistory: true });

    expect(mockGetData).toHaveBeenCalledTimes(2);
    expect(mockGetData).toHaveBeenNthCalledWith(1, mockLayer, 'configName');
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenLastCalledWith('Change layer module');
    expect(mockGetPresetsList).toHaveBeenCalledTimes(2);
    expect(mockGetPresetsList).toHaveBeenNthCalledWith(1, 'ado1', LayerModule.LASER_10W_DIODE);
    expect(mockGetPresetsList).toHaveBeenNthCalledWith(2, 'ado1', LayerModule.LASER_20W_DIODE);
    expect(mockWriteDataLayer).toHaveBeenCalledTimes(1);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(1, mockLayer, 'module', LayerModule.LASER_20W_DIODE, {
      batchCmd,
    });
    expect(mockApplyPreset).not.toHaveBeenCalled();
    expect(mockToggleFullColorLayer).toHaveBeenCalledTimes(1);
    expect(mockToggleFullColorLayer).toHaveBeenNthCalledWith(1, mockLayer, { val: false });
    expect(batchCmd.addSubCommand).toHaveBeenCalledTimes(1);
    expect(mockInitState).toHaveBeenCalledTimes(1);
    expect(mockForceUpdate).toHaveBeenCalledTimes(1);
    expect(mockTogglePresprayArea).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, batchCmd);

    batchCmd.onAfter();
    expect(mockInitState).toHaveBeenCalledTimes(2);
    expect(mockForceUpdate).toHaveBeenCalledTimes(2);
    expect(mockTogglePresprayArea).toHaveBeenCalledTimes(2);
  });

  test('change to 20w without corresponding config', () => {
    mockGetPresetsList.mockReturnValueOnce([{ name: 'config1', power: 88, repeat: 89, speed: 87 }]);
    changeLayersModule([mockLayer], LayerModule.LASER_10W_DIODE, LayerModule.LASER_20W_DIODE, { addToHistory: true });

    expect(mockGetData).toHaveBeenCalledTimes(2);
    expect(mockGetData).toHaveBeenNthCalledWith(1, mockLayer, 'configName');
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenLastCalledWith('Change layer module');
    expect(mockGetPresetsList).toHaveBeenCalledTimes(2);
    expect(mockGetPresetsList).toHaveBeenNthCalledWith(1, 'ado1', LayerModule.LASER_10W_DIODE);
    expect(mockGetPresetsList).toHaveBeenNthCalledWith(2, 'ado1', LayerModule.LASER_20W_DIODE);
    expect(mockWriteDataLayer).toHaveBeenCalledTimes(2);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(1, mockLayer, 'module', LayerModule.LASER_20W_DIODE, {
      batchCmd,
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(2, mockLayer, 'configName', undefined, {
      batchCmd,
    });
    expect(mockApplyPreset).not.toHaveBeenCalled();
    expect(mockToggleFullColorLayer).toHaveBeenCalledTimes(1);
    expect(mockToggleFullColorLayer).toHaveBeenNthCalledWith(1, mockLayer, { val: false });
    expect(batchCmd.addSubCommand).toHaveBeenCalledTimes(1);
    expect(mockInitState).toHaveBeenCalledTimes(1);
    expect(mockForceUpdate).toHaveBeenCalledTimes(1);
    expect(mockTogglePresprayArea).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, batchCmd);

    batchCmd.onAfter();
    expect(mockInitState).toHaveBeenCalledTimes(2);
    expect(mockForceUpdate).toHaveBeenCalledTimes(2);
    expect(mockTogglePresprayArea).toHaveBeenCalledTimes(2);
  });

  test('change to printer', async () => {
    changeLayersModule([mockLayer], LayerModule.LASER_10W_DIODE, LayerModule.PRINTER, { addToHistory: true });

    expect(mockPopUp).toHaveBeenCalledTimes(1);
    await mockPopUp.mock.calls[0][0].onConfirm();
    expect(mockGetData).toHaveBeenCalledTimes(2);
    expect(mockGetData).toHaveBeenNthCalledWith(1, mockLayer, 'configName');
    expect(mockBatchCommand).toHaveBeenCalledTimes(1);
    expect(mockBatchCommand).toHaveBeenLastCalledWith('Change layer module');
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(1, mockLayer, 'module', LayerModule.PRINTER, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(2, mockLayer, 'configName', undefined, {
      batchCmd,
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(3, mockLayer, 'printingSpeed', 60, {
      batchCmd,
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(4, mockLayer, 'ink', 3, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(5, mockLayer, 'multipass', 5, { batchCmd });
    expect(mockToggleFullColorLayer).toHaveBeenCalledTimes(1);
    expect(mockToggleFullColorLayer).toHaveBeenNthCalledWith(1, mockLayer, { val: true });
    expect(batchCmd.addSubCommand).toHaveBeenCalledTimes(1);
    expect(mockInitState).toHaveBeenCalledTimes(1);
    expect(mockForceUpdate).toHaveBeenCalledTimes(1);
    expect(mockTogglePresprayArea).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, batchCmd);

    batchCmd.onAfter();
    expect(mockInitState).toHaveBeenCalledTimes(2);
    expect(mockForceUpdate).toHaveBeenCalledTimes(2);
    expect(mockTogglePresprayArea).toHaveBeenCalledTimes(2);
  });
});
