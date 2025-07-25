import React, { act } from 'react';

import { fireEvent, render } from '@testing-library/react';

import alertConstants from '@core/app/constants/alert-constants';
import { LaserType } from '@core/app/constants/promark-constants';
import i18n from '@core/helpers/i18n';

const mockEventEmitter = { emit: jest.fn(), on: jest.fn() };
const mockCreateEventEmitter = jest.fn();

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: (...args) => {
    mockCreateEventEmitter(...args);

    return mockEventEmitter;
  },
}));

jest.mock('@core/helpers/hooks/useHasCurveEngraving', () => () => false);
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
  'auto-feeder': false,
  'auto-feeder-scale': 1,
  auto_shrink: false,
  borderless: false,
  'customized-dimension': { fpm1: { height: 150, width: 150 } },
  'enable-autofocus': false,
  'enable-diode': false,
  engrave_dpi: 'medium',
  'extend-rotary-workarea': undefined,
  'job-origin': 1,
  'path-trough': false,
  rotary_mode: false,
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

const mockUnmount = jest.fn();
const mockQuerySelectorAll = jest.fn();

import DocumentSettings from './index';

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
    fireEvent.click(baseElement.querySelector('button#autoShrink'));
    expect(baseElement).toMatchSnapshot();

    expect(mockBeamboxPreferenceWrite).not.toHaveBeenCalled();
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
    expect(mockBeamboxPreferenceWrite).toHaveBeenCalledTimes(13);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(1, 'engrave_dpi', 'high');
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(2, 'borderless', true);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(3, 'enable-diode', true);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(4, 'enable-autofocus', true);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(5, 'rotary_mode', false);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(6, 'pass-through', true);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(7, 'pass-through-height', 500);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(8, 'auto-feeder', false);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(9, 'auto-feeder-height', 320);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(10, 'auto-feeder-scale', 1);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(11, 'enable-job-origin', true);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(12, 'job-origin', 1);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(13, 'auto_shrink', true);
    expect(mockChangeWorkarea).toHaveBeenCalledTimes(1);
    expect(mockChangeWorkarea).toHaveBeenLastCalledWith('fbm1', { toggleModule: true });
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
    expect(baseElement.querySelector('button#door_protect')).toBeInTheDocument();
    act(() => fireEvent.click(baseElement.querySelector('button#door_protect')));

    expect(baseElement).toMatchSnapshot();
    fireEvent.click(getByText('Save'));
    expect(mockBeamboxPreferenceWrite).toHaveBeenCalledTimes(14);
    expect(mockBeamboxPreferenceWrite).toHaveBeenCalledWith('customized-dimension', {
      fpm1: { height: 110, width: 110 },
    });
    expect(mockBeamboxPreferenceWrite).toHaveBeenCalledWith('promark-start-button', true);
    expect(mockBeamboxPreferenceWrite).toHaveBeenCalledWith('frame-before-start', true);
    expect(mockBeamboxPreferenceWrite).toHaveBeenCalledWith('promark-safety-door', true);
    expect(mockSetPromarkInfo).toHaveBeenCalledTimes(1);
    expect(mockSetPromarkInfo).toHaveBeenLastCalledWith({ laserType: LaserType.MOPA, watt: 60 });
  });

  test('set auto feeder height', async () => {
    document.querySelectorAll = mockQuerySelectorAll;

    const { baseElement, getByText } = render(<DocumentSettings unmount={mockUnmount} />);

    act(() => fireEvent.mouseDown(baseElement.querySelector('input#workareaSelect')));
    fireEvent.click(baseElement.querySelector('.rc-virtual-list [title="Beambox II"]'));

    fireEvent.click(baseElement.querySelector('button#auto_feeder'));
    fireEvent.change(baseElement.querySelector('#auto_feeder_height'), { target: { value: 870 } });
    fireEvent.click(getByText('Save'));
    expect(mockBeamboxPreferenceWrite).toHaveBeenCalledWith('auto-feeder', true);
    expect(mockBeamboxPreferenceWrite).toHaveBeenCalledWith('auto-feeder-height', 870);
  });
});
