import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import LayerModule from '@core/app/constants/layer-module/layer-modules';

import ConfigPanelContext from './ConfigPanelContext';

jest.mock('@core/helpers/useI18n', () => () => ({
  beambox: {
    popup: {
      dont_show_again: 'dont_show_again',
    },
    right_panel: {
      laser_panel: {
        module: 'module',
      },
    },
  },
  layer_module: {
    laser_2w_infrared: 'laser_2w_infrared',
    laser_10w_diode: 'laser_10w_diode',
    laser_20w_diode: 'laser_20w_diode',
    notification: {
      convertFromPrintingModuleMsg: 'convertFromPrintingModuleMsg',
      convertFromPrintingModuleTitle: 'convertFromPrintingModuleTitle',
    },
    printing: 'printing',
  },
}));

const mockAddCommandToHistory = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) => {
    callback({
      Canvas: {
        addCommandToHistory: mockAddCommandToHistory,
      },
    });
  },
}));

const mockUseWorkarea = jest.fn();

jest.mock('@core/helpers/hooks/useWorkarea', () => () => mockUseWorkarea());

const mockUpdate = jest.fn();

jest.mock('@core/app/actions/canvas/module-boundary-drawer', () => ({
  update: (...args: any) => mockUpdate(...args),
}));

const mockOn = jest.fn();
const mockOff = jest.fn();
const mockEmit = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: () => ({
    emit: (...args) => mockEmit(...args),
    off: (...args) => mockOff(...args),
    on: (...args) => mockOn(...args),
  }),
}));

const mockGetPresetsList = jest.fn();

jest.mock('@core/helpers/presets/preset-helper', () => ({
  getPresetsList: (...args) => mockGetPresetsList(...args),
}));

const mockTogglePresprayArea = jest.fn();

jest.mock('@core/app/actions/canvas/prespray-area', () => ({
  togglePresprayArea: (...args) => mockTogglePresprayArea(...args),
}));

const mockApplyPreset = jest.fn();
const mockWriteDataLayer = jest.fn();
const mockGetData = jest.fn().mockReturnValue('configName');

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  applyPreset: (...args) => mockApplyPreset(...args),
  baseConfig: {
    ink: 3,
    multipass: 3,
    printingSpeed: 60,
    speed: 20,
    strength: 15,
  },
  getData: (...args) => mockGetData(...args),
  writeDataLayer: (...args) => mockWriteDataLayer(...args),
}));

const mockGetLayerElementByName = jest.fn();

jest.mock('@core/helpers/layer/layer-helper', () => ({
  getLayerElementByName: (...args) => mockGetLayerElementByName(...args),
}));

const mockToggleFullColorLayer = jest.fn();

jest.mock(
  '@core/helpers/layer/full-color/toggleFullColorLayer',
  () =>
    (...args) =>
      mockToggleFullColorLayer(...args),
);

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

const mockUpdateLayerPanel = jest.fn();

jest.mock('@core/app/views/beambox/Right-Panels/contexts/LayerPanelController', () => ({
  updateLayerPanel: mockUpdateLayerPanel,
}));

let batchCmd = null;
const mockBatchCommand = jest.fn().mockImplementation(() => {
  batchCmd = { addSubCommand: jest.fn(), onAfter: null };

  return batchCmd;
});

jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: mockBatchCommand,
}));

const mockSelectedLayers = ['layer1', 'layer2'];
const mockContextState = {
  module: { hasMultiValue: false, value: LayerModule.LASER_10W_DIODE },
};

const mockAlertConfigRead = jest.fn();
const mockAlertConfigWrite = jest.fn();

jest.mock('@core/helpers/api/alert-config', () => ({
  read: (...args) => mockAlertConfigRead(...args),
  write: (...args) => mockAlertConfigWrite(...args),
}));

const mockDispatch = jest.fn();
const mockInitState = jest.fn();

import ModuleBlock from './ModuleBlock';

describe('test ModuleBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkarea.mockReturnValue('ado1');
    mockAlertConfigRead.mockReturnValue(false);
  });

  it('should render correctly', () => {
    const { container, unmount } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <ModuleBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toMatchSnapshot();
    expect(mockUseWorkarea).toBeCalledTimes(1);
    expect(mockUpdate).toBeCalledTimes(1);
    expect(mockUpdate).toHaveBeenLastCalledWith(LayerModule.LASER_10W_DIODE);
    expect(mockOn).toBeCalledTimes(1);
    expect(mockOn).toHaveBeenLastCalledWith('canvas-change', expect.any(Function));
    expect(mockOff).not.toBeCalled();
    unmount();
    expect(mockOff).toBeCalledTimes(1);
    expect(mockOff).toHaveBeenLastCalledWith('canvas-change', expect.any(Function));
  });

  it('should not render when workarea does not support module', () => {
    mockUseWorkarea.mockReturnValue('ado2');

    const { container } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <ModuleBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('change to 20w should work with preset change', () => {
    const { baseElement, getByText } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: ['layer1'],
          state: mockContextState as any,
        }}
      >
        <ModuleBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(mockUpdate).toBeCalledTimes(1);
    expect(mockUpdate).toHaveBeenLastCalledWith(LayerModule.LASER_10W_DIODE);
    expect(mockOn).toBeCalledTimes(1);
    fireEvent.mouseDown(baseElement.querySelector('.ant-select-selector'));

    const mockElem = {};

    mockGetLayerElementByName.mockReturnValue(mockElem);
    mockGetPresetsList
      .mockReturnValueOnce([{ name: 'config1', power: 88, repeat: 89, speed: 87 }])
      .mockReturnValueOnce([{ name: 'config1', power: 78, repeat: 79, speed: 77 }]);
    mockGetData.mockReturnValueOnce('config1');
    fireEvent.click(getByText('laser_20w_diode'));
    expect(mockGetData).toBeCalledTimes(1);
    expect(mockGetData).toHaveBeenNthCalledWith(1, mockElem, 'configName');
    expect(mockBatchCommand).toBeCalledTimes(1);
    expect(mockBatchCommand).lastCalledWith('Change layer module');
    expect(mockGetLayerElementByName).toBeCalledTimes(1);
    expect(mockGetLayerElementByName).toHaveBeenNthCalledWith(1, 'layer1');
    expect(mockGetPresetsList).toBeCalledTimes(2);
    expect(mockGetPresetsList).toHaveBeenNthCalledWith(1, 'ado1', LayerModule.LASER_10W_DIODE);
    expect(mockGetPresetsList).toHaveBeenNthCalledWith(2, 'ado1', LayerModule.LASER_20W_DIODE);
    expect(mockWriteDataLayer).toBeCalledTimes(1);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(1, mockElem, 'module', LayerModule.LASER_20W_DIODE, {
      batchCmd,
    });
    expect(mockApplyPreset).toBeCalledTimes(1);
    expect(mockApplyPreset).toHaveBeenNthCalledWith(
      1,
      mockElem,
      { name: 'config1', power: 78, repeat: 79, speed: 77 },
      { batchCmd },
    );
    expect(mockToggleFullColorLayer).toBeCalledTimes(1);
    expect(mockToggleFullColorLayer).toHaveBeenNthCalledWith(1, mockElem, { val: false });
    expect(batchCmd.addSubCommand).toBeCalledTimes(1);
    expect(mockInitState).toBeCalledTimes(1);
    expect(mockInitState).toHaveBeenNthCalledWith(1, ['layer1']);
    expect(mockUpdateLayerPanel).toBeCalledTimes(1);
    expect(mockTogglePresprayArea).toBeCalledTimes(1);
    expect(mockAddCommandToHistory).toBeCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, batchCmd);
    expect(baseElement).toMatchSnapshot();

    batchCmd.onAfter();
    expect(mockInitState).toBeCalledTimes(2);
    expect(mockUpdateLayerPanel).toBeCalledTimes(2);
    expect(mockTogglePresprayArea).toBeCalledTimes(2);
    expect(mockDispatch).not.toBeCalled();
  });

  test('change to 20w should work without preset change', () => {
    const { baseElement, getByText } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: ['layer1'],
          state: mockContextState as any,
        }}
      >
        <ModuleBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(mockUpdate).toBeCalledTimes(1);
    expect(mockUpdate).toHaveBeenLastCalledWith(LayerModule.LASER_10W_DIODE);
    expect(mockOn).toBeCalledTimes(1);
    fireEvent.mouseDown(baseElement.querySelector('.ant-select-selector'));

    const mockElem = {};

    mockGetLayerElementByName.mockReturnValue(mockElem);

    const mockPresetList = [{ name: 'config1', power: 88, repeat: 89, speed: 87 }];

    mockGetPresetsList.mockReturnValue(mockPresetList);
    mockGetData.mockReturnValueOnce('config1');
    fireEvent.click(getByText('laser_20w_diode'));
    expect(mockGetData).toBeCalledTimes(1);
    expect(mockGetData).toHaveBeenNthCalledWith(1, mockElem, 'configName');
    expect(mockBatchCommand).toBeCalledTimes(1);
    expect(mockBatchCommand).lastCalledWith('Change layer module');
    expect(mockGetLayerElementByName).toBeCalledTimes(1);
    expect(mockGetLayerElementByName).toHaveBeenNthCalledWith(1, 'layer1');
    expect(mockGetPresetsList).toBeCalledTimes(2);
    expect(mockGetPresetsList).toHaveBeenNthCalledWith(1, 'ado1', LayerModule.LASER_10W_DIODE);
    expect(mockGetPresetsList).toHaveBeenNthCalledWith(2, 'ado1', LayerModule.LASER_20W_DIODE);
    expect(mockWriteDataLayer).toBeCalledTimes(1);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(1, mockElem, 'module', LayerModule.LASER_20W_DIODE, {
      batchCmd,
    });
    expect(mockApplyPreset).not.toBeCalled();
    expect(mockToggleFullColorLayer).toBeCalledTimes(1);
    expect(mockToggleFullColorLayer).toHaveBeenNthCalledWith(1, mockElem, { val: false });
    expect(batchCmd.addSubCommand).toBeCalledTimes(1);
    expect(mockInitState).toBeCalledTimes(1);
    expect(mockInitState).toHaveBeenNthCalledWith(1, ['layer1']);
    expect(mockUpdateLayerPanel).toBeCalledTimes(1);
    expect(mockTogglePresprayArea).toBeCalledTimes(1);
    expect(mockAddCommandToHistory).toBeCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, batchCmd);

    batchCmd.onAfter();
    expect(mockInitState).toBeCalledTimes(2);
    expect(mockUpdateLayerPanel).toBeCalledTimes(2);
    expect(mockTogglePresprayArea).toBeCalledTimes(2);
    expect(mockDispatch).not.toBeCalled();
  });

  test('change to 20w should work without corresponding config', () => {
    const { baseElement, getByText } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: ['layer1'],
          state: mockContextState as any,
        }}
      >
        <ModuleBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(mockUpdate).toBeCalledTimes(1);
    expect(mockUpdate).toHaveBeenLastCalledWith(LayerModule.LASER_10W_DIODE);
    expect(mockOn).toBeCalledTimes(1);
    fireEvent.mouseDown(baseElement.querySelector('.ant-select-selector'));

    const mockElem = {};

    mockGetLayerElementByName.mockReturnValue(mockElem);
    mockGetPresetsList
      .mockReturnValueOnce([{ name: 'config1', power: 88, repeat: 89, speed: 87 }])
      .mockReturnValueOnce([]);
    mockGetData.mockReturnValueOnce('config1');
    fireEvent.click(getByText('laser_20w_diode'));
    expect(mockGetData).toBeCalledTimes(1);
    expect(mockGetData).toHaveBeenNthCalledWith(1, mockElem, 'configName');
    expect(mockBatchCommand).toBeCalledTimes(1);
    expect(mockBatchCommand).lastCalledWith('Change layer module');
    expect(mockGetLayerElementByName).toBeCalledTimes(1);
    expect(mockGetLayerElementByName).toHaveBeenNthCalledWith(1, 'layer1');
    expect(mockGetPresetsList).toBeCalledTimes(2);
    expect(mockGetPresetsList).toHaveBeenNthCalledWith(1, 'ado1', LayerModule.LASER_10W_DIODE);
    expect(mockGetPresetsList).toHaveBeenNthCalledWith(2, 'ado1', LayerModule.LASER_20W_DIODE);
    expect(mockWriteDataLayer).toBeCalledTimes(2);
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(1, mockElem, 'module', LayerModule.LASER_20W_DIODE, {
      batchCmd,
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(2, mockElem, 'configName', undefined, {
      batchCmd,
    });
    expect(mockApplyPreset).not.toBeCalled();
    expect(mockToggleFullColorLayer).toBeCalledTimes(1);
    expect(mockToggleFullColorLayer).toHaveBeenNthCalledWith(1, mockElem, { val: false });
    expect(batchCmd.addSubCommand).toBeCalledTimes(1);
    expect(mockInitState).toBeCalledTimes(1);
    expect(mockInitState).toHaveBeenNthCalledWith(1, ['layer1']);
    expect(mockUpdateLayerPanel).toBeCalledTimes(1);
    expect(mockTogglePresprayArea).toBeCalledTimes(1);
    expect(mockAddCommandToHistory).toBeCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, batchCmd);

    batchCmd.onAfter();
    expect(mockInitState).toBeCalledTimes(2);
    expect(mockUpdateLayerPanel).toBeCalledTimes(2);
    expect(mockTogglePresprayArea).toBeCalledTimes(2);
    expect(mockDispatch).not.toBeCalled();
  });

  test('change to printer should work when selecting 2 layer', async () => {
    const { baseElement, getByText } = render(
      <ConfigPanelContext.Provider
        value={{
          dispatch: mockDispatch,
          initState: mockInitState,
          selectedLayers: mockSelectedLayers,
          state: mockContextState as any,
        }}
      >
        <ModuleBlock />
      </ConfigPanelContext.Provider>,
    );

    expect(mockUpdate).toBeCalledTimes(1);
    expect(mockUpdate).toHaveBeenLastCalledWith(LayerModule.LASER_10W_DIODE);
    expect(mockOn).toBeCalledTimes(1);
    fireEvent.mouseDown(baseElement.querySelector('.ant-select-selector'));

    const mockElem1 = { name: 'layer1' };
    const mockElem2 = { name: 'layer2' };

    mockGetLayerElementByName.mockReturnValueOnce(mockElem1).mockReturnValue(mockElem2);
    mockGetPresetsList.mockReturnValueOnce([]);
    fireEvent.click(getByText('printing'));
    expect(mockPopUp).toBeCalledTimes(1);
    await mockPopUp.mock.calls[0][0].onConfirm();
    expect(mockGetLayerElementByName).toBeCalledTimes(2);
    expect(mockGetLayerElementByName).toHaveBeenNthCalledWith(1, 'layer1');
    expect(mockGetLayerElementByName).toHaveBeenNthCalledWith(2, 'layer2');
    expect(mockGetData).toBeCalledTimes(2);
    expect(mockGetData).toHaveBeenNthCalledWith(1, mockElem1, 'configName');
    expect(mockGetData).toHaveBeenNthCalledWith(2, mockElem2, 'configName');
    expect(mockBatchCommand).toBeCalledTimes(1);
    expect(mockBatchCommand).lastCalledWith('Change layer module');
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(1, mockElem1, 'module', LayerModule.PRINTER, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(2, mockElem1, 'configName', undefined, {
      batchCmd,
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(3, mockElem1, 'printingSpeed', 60, {
      batchCmd,
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(4, mockElem1, 'ink', 3, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(5, mockElem1, 'multipass', 3, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(6, mockElem2, 'module', LayerModule.PRINTER, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(7, mockElem2, 'configName', undefined, {
      batchCmd,
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(8, mockElem2, 'printingSpeed', 60, {
      batchCmd,
    });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(9, mockElem2, 'ink', 3, { batchCmd });
    expect(mockWriteDataLayer).toHaveBeenNthCalledWith(10, mockElem2, 'multipass', 3, { batchCmd });
    expect(mockToggleFullColorLayer).toBeCalledTimes(2);
    expect(mockToggleFullColorLayer).toHaveBeenNthCalledWith(1, mockElem1, { val: true });
    expect(mockToggleFullColorLayer).toHaveBeenNthCalledWith(2, mockElem2, { val: true });
    expect(batchCmd.addSubCommand).toBeCalledTimes(2);
    expect(mockInitState).toBeCalledTimes(1);
    expect(mockInitState).toHaveBeenNthCalledWith(1, ['layer1', 'layer2']);
    expect(mockUpdateLayerPanel).toBeCalledTimes(1);
    expect(mockTogglePresprayArea).toBeCalledTimes(1);
    expect(mockAddCommandToHistory).toBeCalledTimes(1);
    expect(mockAddCommandToHistory).toHaveBeenNthCalledWith(1, batchCmd);
    expect(baseElement).toMatchSnapshot();

    batchCmd.onAfter();
    expect(mockInitState).toBeCalledTimes(2);
    expect(mockUpdateLayerPanel).toBeCalledTimes(2);
    expect(mockTogglePresprayArea).toBeCalledTimes(2);
    expect(mockDispatch).not.toBeCalled();
  });
});
