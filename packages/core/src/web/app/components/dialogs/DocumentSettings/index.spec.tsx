import React, { act } from 'react';

import { fireEvent, render } from '@testing-library/react';

import alertConstants from '@core/app/constants/alert-constants';
import { LaserType } from '@core/app/constants/promark-constants';
import i18n from '@core/helpers/i18n';
import { LayerModule } from '@core/app/constants/layer-module/layer-modules';

const mockEventEmitter = { emit: jest.fn(), on: jest.fn() };
const mockCreateEventEmitter = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: (...args) => {
    mockCreateEventEmitter(...args);

    return mockEventEmitter;
  },
}));

jest.mock('@core/helpers/hooks/useHasCurveEngraving', () => () => false);

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
  'auto-feeder-scale': 1,
  auto_shrink: false,
  borderless: false,
  'customized-dimension': { fpm1: { height: 150, width: 150 } },
  'enable-4c': true,
  'enable-1064': true,
  'enable-autofocus': false,
  'enable-diode': false,
  engrave_dpi: 'medium',
  'extend-rotary-workarea': undefined,
  'job-origin': 1,
  'path-trough': false,
  rotary_mode: false,
  update: mockUpdate,
  workarea: 'fbm1',
};
const mockGetState = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: {
    getState: () => mockGetState(),
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

const mockGetLayersByModule = jest.fn();
const mockGetModulesTranslations = jest.fn();
const mockHasModuleLayer = jest.fn();

jest.mock('@core/helpers/layer-module/layer-module-helper', () => ({
  getLayersByModule: mockGetLayersByModule,
  getModulesTranslations: mockGetModulesTranslations,
  hasModuleLayer: mockHasModuleLayer,
}));

const mockOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: (...args) => mockOpen(...args),
}));

const mockUnmount = jest.fn();

import DocumentSettings from './index';

describe('test DocumentSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPromarkInfo.mockReturnValue({ laserType: LaserType.Desktop, watt: 20 });
    mockGetModulesTranslations.mockReturnValue({
      [LayerModule.LASER_1064]: 'Module 1064',
      [LayerModule.PRINTER_4C]: 'Module 4C',
    });
    mockHasModuleLayer.mockReturnValue(false);
    mockGetState.mockReturnValue(mockDocumentState);
  });

  it('should render correctly for ador', async () => {
    const { baseElement } = render(<DocumentSettings unmount={mockUnmount} />);
    const workareaToggle = baseElement.querySelector('input#workareaSelect');

    fireEvent.mouseDown(workareaToggle);
    fireEvent.click(baseElement.querySelector('.rc-virtual-list [title="Ador"]'));
    expect(baseElement).toMatchSnapshot();
    fireEvent.click(baseElement.querySelector('button#rotary_mode'));
    expect(baseElement).toMatchSnapshot();
  });

  it('should render correctly', async () => {
    mockGetState.mockReturnValue({ ...mockDocumentState, workarea: 'ado1' });

    const { baseElement, getByText } = render(<DocumentSettings unmount={mockUnmount} />);

    expect(baseElement).toMatchSnapshot();

    act(() => fireEvent.mouseDown(baseElement.querySelector('input#dpi')));
    act(() => {
      fireEvent.click(baseElement.querySelectorAll('.ant-slide-up-appear .ant-select-item-option-content')[2]);
    });
    expect(baseElement).toMatchSnapshot();
    act(() => fireEvent.mouseDown(baseElement.querySelector('input#workareaSelect')));
    fireEvent.click(baseElement.querySelector('.rc-virtual-list [title="beamo"]'));
    fireEvent.click(baseElement.querySelector('button#rotary_mode'));
    fireEvent.click(baseElement.querySelector('button#borderless_mode'));
    fireEvent.click(baseElement.querySelector('button#autofocus-module'));
    fireEvent.click(baseElement.querySelector('button#diode_module'));
    fireEvent.click(baseElement.querySelector('button#pass_through'));
    fireEvent.change(baseElement.querySelector('#pass_through_height'), {
      target: { value: 500 },
    });
    fireEvent.blur(baseElement.querySelector('#pass_through_height'));
    act(() => fireEvent.mouseDown(baseElement.querySelector('input#startFrom')));
    act(() => {
      fireEvent.click(baseElement.querySelectorAll('.ant-slide-up-appear .ant-select-item-option-content')[1]);
    });
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
    expect(mockUpdate).toHaveBeenLastCalledWith({
      'auto-feeder': false,
      'auto-feeder-height': 320,
      'auto-feeder-scale': 1,
      auto_shrink: true,
      borderless: true,
      'enable-4c': true,
      'enable-1064': true,
      'enable-autofocus': true,
      'enable-diode': true,
      'enable-job-origin': true,
      engrave_dpi: 'high',
      'job-origin': 1,
      'pass-through': true,
      'pass-through-height': 500,
      rotary_mode: false,
    });
    expect(mockChangeWorkarea).toHaveBeenCalledTimes(1);
    expect(mockChangeWorkarea).toHaveBeenLastCalledWith('fbm1', { toggleModule: true });
    expect(mockSetPosition).toHaveBeenCalledTimes(1);
    expect(mockSetPosition).toHaveBeenLastCalledWith(1050, { write: true });
    expect(mockToggleDisplay).toHaveBeenCalledTimes(1);
    expect(mockTogglePresprayArea).toHaveBeenCalledTimes(1);
    expect(mockCreateEventEmitter).toHaveBeenCalledTimes(1);
    expect(mockCreateEventEmitter).toHaveBeenNthCalledWith(1, 'canvas');
    expect(mockEventEmitter.emit).toHaveBeenCalledTimes(2);
    expect(mockEventEmitter.emit).toHaveBeenNthCalledWith(1, 'GET_CANVAS_MODE', { mode: 1 });
    expect(mockEventEmitter.emit).toHaveBeenNthCalledWith(2, 'document-settings-saved');
    expect(mockUnmount).toHaveBeenCalledTimes(1);
  });

  it('should render correctly for promark', async () => {
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

    const { baseElement, getByText } = render(<DocumentSettings unmount={mockUnmount} />);

    act(() => fireEvent.mouseDown(baseElement.querySelector('input#workareaSelect')));
    fireEvent.click(baseElement.querySelector('.rc-virtual-list [title="beamo II"]'));

    fireEvent.click(getByText('Module 1064'));
    fireEvent.click(getByText('Module 4C'));
    expect(baseElement).toMatchSnapshot();
    fireEvent.click(getByText('Save'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockUpdate).toHaveBeenCalledTimes(1);

    const updatePayload = mockUpdate.mock.calls[0][0];

    expect(updatePayload['enable-1064']).toBe(false);
    expect(updatePayload['enable-4c']).toBe(undefined);
    expect(mockGetLayersByModule).toHaveBeenCalledTimes(2);
    expect(mockGetLayersByModule).toHaveBeenNthCalledWith(1, [
      LayerModule.PRINTER_4C,
      LayerModule.UV_WHITE_INK,
      LayerModule.UV_VARNISH,
    ]);
    expect(mockGetLayersByModule).toHaveBeenNthCalledWith(2, [LayerModule.LASER_1064]);
    expect(mockChangeLayersModule).toHaveBeenCalledTimes(2);
    expect(mockChangeLayersModule).toHaveBeenNthCalledWith(
      1,
      ['mockLayer'],
      LayerModule.PRINTER_4C,
      LayerModule.LASER_UNIVERSAL,
    );
    expect(mockChangeLayersModule).toHaveBeenNthCalledWith(
      2,
      ['mockLayer'],
      LayerModule.LASER_1064,
      LayerModule.LASER_UNIVERSAL,
    );
  });

  test('set auto feeder height', async () => {
    const { baseElement, getByText } = render(<DocumentSettings unmount={mockUnmount} />);

    act(() => fireEvent.mouseDown(baseElement.querySelector('input#workareaSelect')));
    fireEvent.click(baseElement.querySelector('.rc-virtual-list [title="Beambox II"]'));

    fireEvent.click(baseElement.querySelector('button#auto_feeder'));
    fireEvent.change(baseElement.querySelector('#auto_feeder_height'), { target: { value: 870 } });
    fireEvent.click(getByText('Save'));

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        'auto-feeder': true,
        'auto-feeder-height': 870,
      }),
    );
  });
});
