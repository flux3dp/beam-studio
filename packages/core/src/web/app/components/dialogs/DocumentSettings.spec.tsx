import React, { act } from 'react';

import { fireEvent, render } from '@testing-library/react';

import { LaserType } from '@core/app/constants/promark-constants';
import i18n from '@core/helpers/i18n';

import DocumentSettings from './DocumentSettings';
import alertConstants from '@core/app/constants/alert-constants';

const mockEventEmitter = {
  emit: jest.fn(),
};
const mockCreateEventEmitter = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: (...args) => {
    mockCreateEventEmitter(...args);

    return mockEventEmitter;
  },
}));

jest.mock('@core/helpers/is-dev', () => () => true);

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

const mockBeamboxPreferences = {
  borderless: false,
  'enable-autofocus': false,
  'enable-diode': false,
  engrave_dpi: 'medium',
  'extend-rotary-workarea': undefined,
  rotary_mode: 0,
  workarea: 'fbm1',
};
const mockBeamboxPreferenceWrite = jest.fn();

jest.mock('@core/app/actions/beambox/beambox-preference', () => ({
  read: (key) => mockBeamboxPreferences[key],
  write: (key, value) => {
    mockBeamboxPreferences[key] = value;
    mockBeamboxPreferenceWrite(key, value);
  },
}));

const update = jest.fn();

jest.mock('@core/app/actions/beambox/open-bottom-boundary-drawer', () => ({
  update: () => update(),
}));

const mockToggleDisplay = jest.fn();

jest.mock('@core/app/actions/canvas/rotary-axis', () => ({
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

const mockDiodeBoundaryDrawerShow = jest.fn();
const mockDiodeBoundaryDrawerHide = jest.fn();

jest.mock('@core/app/actions/canvas/diode-boundary-drawer', () => ({
  hide: () => mockDiodeBoundaryDrawerHide(),
  show: () => mockDiodeBoundaryDrawerShow(),
}));

const mockGetPromarkInfo = jest.fn();
const mockSetPromarkInfo = jest.fn();

jest.mock('@core/helpers/device/promark/promark-info', () => ({
  getPromarkInfo: (...args) => mockGetPromarkInfo(...args),
  setPromarkInfo: (...args) => mockSetPromarkInfo(...args),
}));

const mockOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: (...args) => mockOpen(...args),
}));

jest.mock('@core/helpers/checkFeature', () => ({
  checkFbb2: () => true,
  checkFpm1: () => true,
}));

const mockUnmount = jest.fn();
const mockQuerySelectorAll = jest.fn();

describe('test DocumentSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPromarkInfo.mockReturnValue({ laserType: LaserType.Desktop, watt: 20 });
    mockQuerySelectorAll.mockReturnValue([]);
    mockBeamboxPreferences.workarea = 'fbm1';
  });

  it('should render correctly for ador', async () => {
    document.querySelectorAll = mockQuerySelectorAll;

    const { baseElement } = render(<DocumentSettings unmount={mockUnmount} />);
    const workareaToggle = baseElement.querySelector('input#workareaSelect');

    fireEvent.mouseDown(workareaToggle);
    fireEvent.click(baseElement.querySelector('.rc-virtual-list [title="Ador"]'));
    expect(baseElement).toMatchSnapshot();
    fireEvent.click(baseElement.querySelector('button#rotary_mode'));
    expect(baseElement).toMatchSnapshot();
  });

  it('should render correctly', async () => {
    mockBeamboxPreferences.workarea = 'ado1';
    document.querySelectorAll = mockQuerySelectorAll;

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
    expect(baseElement).toMatchSnapshot();

    expect(mockBeamboxPreferenceWrite).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(mockUnmount).not.toHaveBeenCalled();
    expect(mockChangeWorkarea).not.toHaveBeenCalled();
    mockQuerySelectorAll.mockReturnValueOnce([1]);
    fireEvent.click(getByText('Save'));
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
    expect(mockBeamboxPreferenceWrite).toHaveBeenCalledTimes(10);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(1, 'engrave_dpi', 'high');
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(2, 'borderless', true);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(3, 'enable-diode', true);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(4, 'enable-autofocus', true);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(5, 'rotary_mode', 0);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(6, 'pass-through', true);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(7, 'pass-through-height', 500);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(8, 'auto-feeder', false);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(9, 'enable-job-origin', 1);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(10, 'job-origin', 1);
    expect(mockChangeWorkarea).toHaveBeenCalledTimes(1);
    expect(mockChangeWorkarea).toHaveBeenLastCalledWith('fbm1', { toggleModule: true });
    expect(mockToggleDisplay).toHaveBeenCalledTimes(1);
    expect(mockTogglePresprayArea).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
    expect(mockDiodeBoundaryDrawerShow).toHaveBeenCalledTimes(0);
    expect(mockDiodeBoundaryDrawerHide).toHaveBeenCalledTimes(0);
    expect(mockCreateEventEmitter).toHaveBeenCalledTimes(2);
    expect(mockCreateEventEmitter).toHaveBeenNthCalledWith(1, 'dpi-info');
    expect(mockCreateEventEmitter).toHaveBeenNthCalledWith(2, 'canvas');
    expect(mockEventEmitter.emit).toHaveBeenCalledTimes(2);
    expect(mockEventEmitter.emit).toHaveBeenNthCalledWith(1, 'UPDATE_DPI', 'high');
    expect(mockEventEmitter.emit).toHaveBeenNthCalledWith(2, 'document-settings-saved');
    expect(mockUnmount).toHaveBeenCalledTimes(1);
  });

  it('should render correctly for promark', async () => {
    document.querySelectorAll = mockQuerySelectorAll;

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

    expect(baseElement).toMatchSnapshot();
    fireEvent.click(getByText('Save'));
    expect(mockBeamboxPreferenceWrite).toHaveBeenCalledTimes(12);
    expect(mockBeamboxPreferenceWrite).toHaveBeenCalledWith('customized-dimension', {
      fpm1: { height: 110, width: 110 },
    });
    expect(mockBeamboxPreferenceWrite).toHaveBeenCalledWith('promark-start-button', 1);
    expect(mockBeamboxPreferenceWrite).toHaveBeenCalledWith('frame-before-start', 1);
    expect(mockSetPromarkInfo).toHaveBeenCalledTimes(1);
    expect(mockSetPromarkInfo).toHaveBeenLastCalledWith({ laserType: LaserType.MOPA, watt: 60 });
  });

  test('set auto feeder height', async () => {
    document.querySelectorAll = mockQuerySelectorAll;

    const { baseElement, getByText } = render(<DocumentSettings unmount={mockUnmount} />);

    act(() => fireEvent.mouseDown(baseElement.querySelector('input#workareaSelect')));
    fireEvent.click(baseElement.querySelector('.rc-virtual-list [title="Beambox II"]'));

    fireEvent.click(baseElement.querySelector('button#auto_feeder'));
    fireEvent.change(baseElement.querySelector('#auto_feeder_height'), {
      target: { value: 870 },
    });
    fireEvent.click(getByText('Save'));
    expect(mockBeamboxPreferenceWrite).toHaveBeenCalledWith('auto-feeder', true);
    expect(mockBeamboxPreferenceWrite).toHaveBeenCalledWith('auto-feeder-height', 870);
  });
});
