import React, { act } from 'react';

import { fireEvent, render } from '@testing-library/react';

import alertConstants from '@core/app/constants/alert-constants';
import { LaserType } from '@core/app/constants/promark-constants';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import i18n from '@core/helpers/i18n';

const mockEventEmitter = { emit: jest.fn(), on: jest.fn() };
const mockCreateEventEmitter = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: (...args) => {
    mockCreateEventEmitter(...args);

    return mockEventEmitter;
  },
}));

jest.mock('@core/app/stores/curveEngravingStore', () => ({
  useCurveEngravingStore: (selector: (state: { hasData: boolean; maxAngle: number }) => unknown) =>
    selector({ hasData: false, maxAngle: 0 }),
}));

jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  ConfigProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

jest.mock('@core/app/constants/alert-constants', () => ({
  CONFIRM_CANCEL: 'CONFIRM_CANCEL',
}));

const mockUpdate = jest.fn();
const mockDocumentState = {
  'auto-feeder': false,
  'auto-feeder-height': 320,
  'auto-feeder-scale': 1,
  auto_shrink: false,
  borderless: false,
  'customized-dimension': { fpm1: { height: 150, width: 150 } },
  'enable-4c': true,
  'enable-1064': false,
  'enable-autofocus': false,
  'enable-diode': false,
  'enable-job-origin': false,
  'extend-rotary-workarea': undefined,
  'frame-before-start': false,
  'job-origin': 1,
  'pass-through': false,
  'pass-through-height': 320,
  'promark-safety-door': false,
  'promark-start-button': false,
  'rotary-chuck-obj-d': 50,
  'rotary-scale': 1,
  'rotary-type': 0,
  rotary_mode: false,
  update: mockUpdate,
  workarea: 'fbm1',
};
const mockGetState = jest.fn();
const mockUseDocumentStore = jest.fn();

const mockUseDocumentStoreFunction = (selector?: (state: any) => any) => {
  if (selector) return mockUseDocumentStore(selector);

  return mockGetState();
};

mockUseDocumentStoreFunction.getState = () => mockGetState();

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: mockUseDocumentStoreFunction,
}));

const mockStorageState = { isInch: false };
const mockUseStorageStore = jest.fn();
const mockGetStorage = jest.fn();
const mockSetStorage = jest.fn();
const mockStorageSubscribe = jest.fn();

const mockUseStorageStoreFunction = (selector?: (state: any) => any) => {
  if (selector) return mockUseStorageStore(selector);

  return mockStorageState;
};

mockUseStorageStoreFunction.subscribe = mockStorageSubscribe;
mockUseStorageStoreFunction.getState = () => mockStorageState;

jest.mock('@core/app/stores/storageStore', () => ({
  getStorage: (...args: any[]) => mockGetStorage(...args),
  setStorage: (...args: any[]) => mockSetStorage(...args),
  useStorageStore: mockUseStorageStoreFunction,
}));

const mockChangeConfig = jest.fn();
const mockConfigPanelState = { change: mockChangeConfig, dpi: { value: 'low' } };
const mockUseConfigPanelStore = jest.fn();

const mockUseConfigPanelStoreFunction = (selector?: (state: any) => any) => {
  if (selector) return mockUseConfigPanelStore(selector);

  return mockConfigPanelState;
};

jest.mock('@core/app/stores/configPanel', () => ({
  useConfigPanelStore: mockUseConfigPanelStoreFunction,
}));

const mockCanvasState = { mode: 'select', watt: 20 };
const mockUseCanvasStore = jest.fn();
const mockSetCanvasState = jest.fn();

const mockUseCanvasStoreFunction = (selector?: (state: any) => any) => {
  if (selector) return mockUseCanvasStore(selector);

  return mockCanvasState;
};

mockUseCanvasStoreFunction.getState = () => mockCanvasState;
mockUseCanvasStoreFunction.setState = (...args) => mockSetCanvasState(...args);

jest.mock('@core/app/stores/canvas/canvasStore', () => ({
  useCanvasStore: mockUseCanvasStoreFunction,
}));

const mockLayerState = { selectedLayers: [] };

jest.mock('@core/app/stores/layer/layerStore', () => ({
  __esModule: true,
  default: {
    getState: () => mockLayerState,
  },
}));

const mockAddCommandToHistory = jest.fn();
const mockBatchCommandOnAfter = jest.fn();

jest.mock('@core/app/svgedit/history/history', () => ({
  BatchCommand: jest.fn().mockImplementation(() => ({
    addSubCommand: jest.fn(),
    onAfter: mockBatchCommandOnAfter,
  })),
}));

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (cb: (svg: any) => void) =>
    cb({
      Canvas: {
        addCommandToHistory: (...args) => mockAddCommandToHistory(...args),
        getSelectedElems: () => [],
      },
    }),
}));

const mockGetData = jest.fn();
const mockWriteData = jest.fn();

jest.mock('@core/helpers/layer/layer-config-helper', () => ({
  getData: (...args) => mockGetData(...args),
  writeData: (...args) => mockWriteData(...args),
}));

jest.mock('../../beambox/RightPanel/ConfigPanel/initState', () => jest.fn());

const mockCheckBM2 = jest.fn().mockReturnValue(true);
const mockCheckFpm1 = jest.fn().mockReturnValue(true);
const mockCheckFUV1 = jest.fn().mockReturnValue(false);
const mockCheckHxRf = jest.fn().mockReturnValue(false);

jest.mock('@core/helpers/checkFeature', () => ({
  checkBM2: () => mockCheckBM2(),
  checkFpm1: () => mockCheckFpm1(),
  checkFUV1: () => mockCheckFUV1(),
  checkHxRf: () => mockCheckHxRf(),
}));

const mockGetWorkareaResult = {
  dimensionCustomizable: false,
  displayHeight: undefined,
  engraveDpiOptions: undefined,
  height: 2100,
  pxHeight: 2100,
  supportedModules: undefined,
  width: 3000,
};
const mockGetWorkarea = jest.fn().mockReturnValue(mockGetWorkareaResult);

jest.mock('@core/app/constants/workarea-constants', () => ({
  getWorkarea: (...args) => mockGetWorkarea(...args),
}));

const mockAddOnInfo = {
  autoFeeder: { maxHeight: 5000 },
  autoFocus: true,
  curveEngraving: false,
  hybridLaser: true,
  jobOrigin: false,
  multiModules: false,
  openBottom: true,
  passThrough: { maxHeight: 5000 },
  rotary: { chuck: false },
};
const mockGetAddOnInfo = jest.fn().mockReturnValue(mockAddOnInfo);

jest.mock('@core/app/constants/addOn', () => ({
  getAddOnInfo: (...args) => mockGetAddOnInfo(...args),
}));

jest.mock('@core/helpers/addOn', () => ({
  getAutoFeeder: (info: any) => info?.autoFeeder ?? false,
  getPassThrough: (info: any) => info?.passThrough ?? false,
}));

jest.mock('@core/helpers/units', () => ({
  __esModule: true,
  default: {
    convertUnit: jest.fn((val: number) => (val / 25.4).toFixed(2)),
  },
}));

const mockToggleDisplay = jest.fn();
const mockSetPosition = jest.fn();

jest.mock('@core/app/actions/canvas/rotary-axis', () => ({
  setPosition: (...args) => mockSetPosition(...args),
  toggleDisplay: () => mockToggleDisplay(),
}));

const mockTogglePresprayArea = jest.fn();

jest.mock('@core/app/actions/canvas/prespray-area', () => ({
  togglePresprayArea: () => mockTogglePresprayArea(),
}));

const mockChangeWorkarea = jest.fn();

jest.mock(
  '@core/app/svgedit/operations/changeWorkarea',
  () =>
    (...args) =>
      mockChangeWorkarea(...args),
);

const mockGetPromarkInfo = jest.fn();
const mockSetPromarkInfo = jest.fn();

jest.mock('@core/helpers/device/promark/promark-info', () => ({
  getPromarkInfo: (...args) => mockGetPromarkInfo(...args),
  setPromarkInfo: (...args) => mockSetPromarkInfo(...args),
}));

const mockChangeLayersModule = jest.fn();

jest.mock('@core/helpers/layer-module/change-module', () => ({
  changeLayersModule: mockChangeLayersModule,
}));

const mockGetDefaultModule = jest.fn();
const mockGetLayersByModule = jest.fn();
const mockGetModulesTranslations = jest.fn();
const mockHasModuleLayer = jest.fn();

jest.mock('@core/helpers/layer-module/layer-module-helper', () => ({
  getDefaultModule: mockGetDefaultModule,
  getLayersByModule: mockGetLayersByModule,
  getModulesTranslations: mockGetModulesTranslations,
  hasModuleLayer: mockHasModuleLayer,
}));

const mockOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: (...args) => mockOpen(...args),
}));

const mockSetHexa2RfWatt = jest.fn();

jest.mock('@core/helpers/device/deviceStore', () => ({
  fhx2rfWatts: [30, 50, 60],
  setHexa2RfWatt: (...args) => mockSetHexa2RfWatt(...args),
}));

const mockShowModuleSettings4C = jest.fn();
const mockShowPassthroughSettings = jest.fn();

jest.mock('./utils', () => ({
  showModuleSettings4C: (...args) => mockShowModuleSettings4C(...args),
  showPassthroughSettings: (...args) => mockShowPassthroughSettings(...args),
}));

const mockUnmount = jest.fn();

import DocumentSettings from './index';

describe('test DocumentSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPromarkInfo.mockReturnValue({ laserType: LaserType.Desktop, watt: 20 });
    mockGetModulesTranslations.mockReturnValue({
      [LayerModule.LASER_1064]: 'Module 1064',
      [LayerModule.PRINTER]: 'Module Printer',
    });
    mockHasModuleLayer.mockReturnValue(false);
    mockGetLayersByModule.mockReturnValue([]);
    mockGetState.mockReturnValue(mockDocumentState);
    mockGetWorkarea.mockReturnValue(mockGetWorkareaResult);
    mockGetAddOnInfo.mockReturnValue(mockAddOnInfo);
    mockUseDocumentStore.mockImplementation((selector) => selector(mockDocumentState));
    mockUseStorageStore.mockImplementation((selector) => selector(mockStorageState));
    mockUseCanvasStore.mockImplementation((selector) => selector(mockCanvasState));
    mockUseConfigPanelStore.mockImplementation((selector) => selector(mockConfigPanelState));
    mockGetData.mockReturnValue(undefined);
  });

  it('should render correctly for ador', async () => {
    mockGetAddOnInfo.mockReturnValue({
      ...mockAddOnInfo,
      jobOrigin: true,
      multiModules: true,
    });
    mockGetWorkarea.mockReturnValue({
      ...mockGetWorkareaResult,
      pxHeight: 4100,
      supportedModules: [LayerModule.PRINTER_4C, LayerModule.LASER_1064],
    });

    const { baseElement } = render(<DocumentSettings unmount={mockUnmount} />);
    const workareaToggle = baseElement.querySelector('input#workareaSelect');

    fireEvent.mouseDown(workareaToggle);
    fireEvent.click(baseElement.querySelector('.rc-virtual-list [title="Ador"]'));
    expect(baseElement).toMatchSnapshot();
    fireEvent.click(baseElement.querySelector('button#rotaryMaster'));
    expect(baseElement).toMatchSnapshot();
  });

  it('should render correctly', async () => {
    mockGetState.mockReturnValue({ ...mockDocumentState, workarea: 'ado1' });
    mockGetAddOnInfo.mockReturnValue({
      ...mockAddOnInfo,
      jobOrigin: false,
    });

    const { baseElement, getByText } = render(<DocumentSettings unmount={mockUnmount} />);

    expect(baseElement).toMatchSnapshot();

    act(() => fireEvent.mouseDown(baseElement.querySelector('input#workareaSelect')));
    fireEvent.click(baseElement.querySelector('.rc-virtual-list [title="beamo"]'));
    fireEvent.click(baseElement.querySelector('button#rotaryMaster'));
    fireEvent.click(baseElement.querySelector('button#openBottomMaster'));
    fireEvent.click(baseElement.querySelector('button#autofocus-module'));
    fireEvent.click(baseElement.querySelector('button#diode_module'));
    fireEvent.click(baseElement.querySelector('button#passthroughMaster'));
    fireEvent.click(baseElement.querySelector('button#autoShrink'));
    expect(baseElement).toMatchSnapshot();

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockUnmount).not.toHaveBeenCalled();
    expect(mockChangeWorkarea).not.toHaveBeenCalled();
    expect(mockSetPosition).not.toHaveBeenCalled();
    mockHasModuleLayer.mockReturnValue(true);
    fireEvent.click(getByText('Save'));
    expect(mockHasModuleLayer).toHaveBeenCalledTimes(1);
    expect(mockPopUp).toHaveBeenCalledTimes(1);
    expect(mockPopUp).toHaveBeenLastCalledWith({
      buttonType: alertConstants.CONFIRM_CANCEL,
      id: 'save-document-settings',
      message: i18n.lang.beambox.document_panel.notification.changeFromPrintingWorkareaTitle,
      messageIcon: 'notice',
      onCancel: expect.any(Function),
      onConfirm: expect.any(Function),
    });

    const { onConfirm } = mockPopUp.mock.calls[0][0];

    onConfirm();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        'auto-feeder': true,
        auto_shrink: true,
        borderless: true,
        'enable-4c': true,
        'enable-1064': false,
        'enable-autofocus': true,
        'enable-diode': true,
        'enable-job-origin': false,
        'job-origin': 1,
        'pass-through': false,
        rotary_mode: false,
      }),
    );
    expect(mockChangeWorkarea).toHaveBeenCalledTimes(1);
    expect(mockChangeWorkarea).toHaveBeenLastCalledWith('fbm1', { toggleModule: true });
    expect(mockSetPosition).toHaveBeenCalledTimes(1);
    expect(mockSetPosition).toHaveBeenLastCalledWith(mockGetWorkareaResult.pxHeight / 2, { write: true });
    expect(mockToggleDisplay).toHaveBeenCalledTimes(1);
    expect(mockTogglePresprayArea).toHaveBeenCalledTimes(1);
    expect(mockCreateEventEmitter).toHaveBeenCalledTimes(1);
    expect(mockCreateEventEmitter).toHaveBeenNthCalledWith(1, 'canvas');
    expect(mockEventEmitter.emit).toHaveBeenCalledTimes(1);
    expect(mockEventEmitter.emit).toHaveBeenNthCalledWith(1, 'document-settings-saved');
    expect(mockUnmount).toHaveBeenCalledTimes(1);
  });

  it('should render correctly for promark', async () => {
    mockGetAddOnInfo.mockReturnValue({
      ...mockAddOnInfo,
      autoFocus: false,
      hybridLaser: false,
      openBottom: false,
    });
    mockGetWorkarea.mockReturnValue({
      ...mockGetWorkareaResult,
      dimensionCustomizable: true,
    });

    const { baseElement, getByText } = render(<DocumentSettings unmount={mockUnmount} />);

    act(() => fireEvent.mouseDown(baseElement.querySelector('input#workareaSelect')));
    fireEvent.click(baseElement.querySelector('.rc-virtual-list [title="Promark"]'));
    expect(baseElement.querySelector('input#customDimension')).toBeInTheDocument();
    act(() => fireEvent.mouseDown(baseElement.querySelector('input#customDimension')));
    fireEvent.click(baseElement.querySelector('.rc-virtual-list [title="110 x 110 mm"]'));
    expect(baseElement.querySelector('input#pm-laser-source')).toBeInTheDocument();
    act(() => fireEvent.mouseDown(baseElement.querySelector('input#pm-laser-source')));
    fireEvent.click(baseElement.querySelectorAll('.ant-slide-up-appear .ant-select-item-option-content')[4]);
    expect(baseElement.querySelector('input#frame_before_start')).not.toBeInTheDocument();
    expect(baseElement.querySelector('button#start_button')).toBeInTheDocument();
    act(() => fireEvent.click(baseElement.querySelector('button#start_button')));
    expect(baseElement.querySelector('input#frame_before_start')).toBeInTheDocument();
    fireEvent.click(baseElement.querySelector('input#frame_before_start'));
    fireEvent.click(baseElement.querySelector('.anticon-question-circle'));
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(baseElement.querySelector('button#door_protect')).toBeInTheDocument();
    act(() => fireEvent.click(baseElement.querySelector('button#door_protect')));

    expect(baseElement).toMatchSnapshot();
    fireEvent.click(getByText('Save'));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        'customized-dimension': { fpm1: { height: 110, width: 110 } },
        'frame-before-start': true,
        'promark-safety-door': true,
        'promark-start-button': true,
      }),
    );
    expect(mockSetPromarkInfo).toHaveBeenCalledTimes(1);
    expect(mockSetPromarkInfo).toHaveBeenLastCalledWith({ laserType: LaserType.MOPA, watt: 60 });
  });

  it('should render correctly for beamo 2', async () => {
    mockGetLayersByModule.mockReturnValue(['mockLayer']);
    mockChangeLayersModule.mockResolvedValue(false);
    mockGetDefaultModule.mockReturnValue(LayerModule.LASER_UNIVERSAL);
    mockGetAddOnInfo.mockReturnValue({
      ...mockAddOnInfo,
      multiModules: true,
      openBottom: false,
    });
    mockGetWorkarea.mockReturnValue({
      ...mockGetWorkareaResult,
      supportedModules: [LayerModule.PRINTER_4C, LayerModule.LASER_1064],
    });

    const { baseElement, getByText } = render(<DocumentSettings unmount={mockUnmount} />);

    act(() => fireEvent.mouseDown(baseElement.querySelector('input#workareaSelect')));
    fireEvent.click(baseElement.querySelector('.rc-virtual-list [title="beamo II"]'));

    const checkbox4c = baseElement.querySelector('#print_4c_module');
    const checkbox1064 = baseElement.querySelector('#laser_1064_module');

    expect(checkbox4c.getAttribute('aria-checked')).toBe('true');
    expect(checkbox1064.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(getByText('Module 1064'));
    expect(checkbox4c.getAttribute('aria-checked')).toBe('false');
    expect(checkbox1064.getAttribute('aria-checked')).toBe('true');
    expect(baseElement).toMatchSnapshot();
    fireEvent.click(getByText('Save'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockUpdate).toHaveBeenCalledTimes(1);

    const updatePayload = mockUpdate.mock.calls[0][0];

    // Keep 4c layers, switch 1064 off
    expect(updatePayload['enable-1064']).toBe(false);
    expect(updatePayload['enable-4c']).toBe(undefined);
    expect(mockGetLayersByModule).toHaveBeenCalledTimes(1);
    expect(mockGetLayersByModule).toHaveBeenNthCalledWith(1, [
      LayerModule.PRINTER_4C,
      LayerModule.UV_WHITE_INK,
      LayerModule.UV_VARNISH,
    ]);
    expect(mockChangeLayersModule).toHaveBeenCalledTimes(1);
    expect(mockChangeLayersModule).toHaveBeenNthCalledWith(
      1,
      ['mockLayer'],
      LayerModule.PRINTER_4C,
      LayerModule.LASER_UNIVERSAL,
    );
  });

  test('set pass through master', async () => {
    mockGetAddOnInfo.mockReturnValue({
      ...mockAddOnInfo,
      openBottom: false,
    });

    const { baseElement, getByText } = render(<DocumentSettings unmount={mockUnmount} />);

    act(() => fireEvent.mouseDown(baseElement.querySelector('input#workareaSelect')));
    fireEvent.click(baseElement.querySelector('.rc-virtual-list [title="Beambox II"]'));

    // Enable passthrough/auto feeder switch first
    fireEvent.click(baseElement.querySelector('button#passthroughMaster'));
    fireEvent.click(getByText('Save'));

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        'auto-feeder': true,
        'pass-through': false,
      }),
    );
  });

  test('should update DPI for all layers', async () => {
    // Mock DOM layers
    document.body.innerHTML = `
      <g class="layer" data-name="Layer 1" data-engrave-dpi="low"></g>
      <g class="layer" data-name="Layer 2" data-engrave-dpi="low"></g>
    `;

    const { baseElement } = render(<DocumentSettings unmount={mockUnmount} />);

    act(() => fireEvent.mouseDown(baseElement.querySelector('input#dpi-select')));
    fireEvent.click(baseElement.querySelector('.rc-virtual-list [title="250 DPI"]'));

    expect(mockChangeConfig).toHaveBeenCalledWith({ dpi: expect.any(String) });
  });

  test('HEXA RF should show watt selector', async () => {
    // workareaOptions is built at module load time, so checkHxRf() mock cannot
    // affect the dropdown list retroactively. Set workarea directly in state instead.
    mockGetState.mockReturnValue({ ...mockDocumentState, workarea: 'fhx2rf' });
    mockUseDocumentStore.mockImplementation((selector) => selector({ ...mockDocumentState, workarea: 'fhx2rf' }));
    mockGetAddOnInfo.mockReturnValue({
      ...mockAddOnInfo,
      openBottom: false,
    });

    const { baseElement, getByText } = render(<DocumentSettings unmount={mockUnmount} />);

    expect(baseElement.querySelector('input#laser-source')).toBeInTheDocument();

    fireEvent.click(getByText('Save'));
    expect(mockSetHexa2RfWatt).toHaveBeenCalledTimes(1);
    expect(mockSetCanvasState).toHaveBeenCalledWith({ watt: mockCanvasState.watt });
  });
});
