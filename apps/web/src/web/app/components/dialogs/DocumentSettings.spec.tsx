import React, { act } from 'react';
import { fireEvent, render } from '@testing-library/react';

import { LaserType } from 'app/constants/promark-constants';

import DocumentSettings from './DocumentSettings';

const mockEventEmitter = {
  emit: jest.fn(),
};
const mockCreateEventEmitter = jest.fn();
jest.mock('helpers/eventEmitterFactory', () => ({
  createEventEmitter: (...args) => {
    mockCreateEventEmitter(...args);
    return mockEventEmitter;
  },
}));

jest.mock('helpers/locale-helper', () => ({
  isTwOrHk: true,
}));

jest.mock('helpers/is-dev', () => () => true);

jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  ConfigProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockPopUp = jest.fn();
jest.mock('app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

jest.mock('app/constants/alert-constants', () => ({
  CONFIRM_CANCEL: 'CONFIRM_CANCEL',
}));

const beamboxPreferences = {
  engrave_dpi: 'medium',
  workarea: 'ado1',
  rotary_mode: 0,
  borderless: false,
  'enable-diode': false,
  'enable-autofocus': false,
  'extend-rotary-workarea': undefined,
};
const mockBeamboxPreferenceWrite = jest.fn();
jest.mock('app/actions/beambox/beambox-preference', () => ({
  read: (key) => beamboxPreferences[key],
  write: (key, value) => {
    beamboxPreferences[key] = value;
    mockBeamboxPreferenceWrite(key, value);
  },
}));

const update = jest.fn();
jest.mock('app/actions/beambox/open-bottom-boundary-drawer', () => ({
  update: () => update(),
}));

const mockToggleDisplay = jest.fn();
jest.mock('app/actions/canvas/rotary-axis', () => ({
  toggleDisplay: () => mockToggleDisplay(),
}));

const mockTogglePresprayArea = jest.fn();
jest.mock('app/actions/canvas/prespray-area', () => ({
  togglePresprayArea: () => mockTogglePresprayArea(),
}));

const mockChangeWorkarea = jest.fn();
jest.mock(
  'app/svgedit/operations/changeWorkarea',
  () =>
    (...args) =>
      mockChangeWorkarea(...args)
);

const mockDiodeBoundaryDrawerShow = jest.fn();
const mockDiodeBoundaryDrawerHide = jest.fn();
jest.mock('app/actions/canvas/diode-boundary-drawer', () => ({
  show: () => mockDiodeBoundaryDrawerShow(),
  hide: () => mockDiodeBoundaryDrawerHide(),
}));

const mockGetPromarkInfo = jest.fn();
const mockSetPromarkInfo = jest.fn();
jest.mock('helpers/device/promark/promark-info', () => ({
  getPromarkInfo: (...args) => mockGetPromarkInfo(...args),
  setPromarkInfo: (...args) => mockSetPromarkInfo(...args),
}));

const mockOpen = jest.fn();
jest.mock('implementations/browser', () => ({
  open: (...args) => mockOpen(...args),
}));

const mockUnmount = jest.fn();
const mockQuerySelectorAll = jest.fn();

describe('test DocumentSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPromarkInfo.mockReturnValue({ laserType: LaserType.Desktop, watt: 20 });
  });

  it('should render correctly for ador', async () => {
    document.querySelectorAll = mockQuerySelectorAll;
    const { baseElement } = render(<DocumentSettings unmount={mockUnmount} />);
    const workareaToggle = baseElement.querySelector('input#workareaSelect');
    fireEvent.mouseDown(workareaToggle);
    fireEvent.click(
      baseElement.querySelectorAll('.ant-slide-up-appear .ant-select-item-option-content')[4]
    );
    expect(baseElement).toMatchSnapshot();
    fireEvent.click(baseElement.querySelector('button#rotary_mode'));
    expect(baseElement).toMatchSnapshot();
  });

  it('should render correctly', async () => {
    document.querySelectorAll = mockQuerySelectorAll;
    const { baseElement, getByText } = render(<DocumentSettings unmount={mockUnmount} />);
    expect(baseElement).toMatchSnapshot();

    act(() => fireEvent.mouseDown(baseElement.querySelector('input#dpi')));
    act(() => {
      fireEvent.click(
        baseElement.querySelectorAll('.ant-slide-up-appear .ant-select-item-option-content')[2]
      );
    });
    expect(baseElement).toMatchSnapshot();
    act(() => fireEvent.mouseDown(baseElement.querySelector('input#workareaSelect')));
    fireEvent.click(
      baseElement.querySelectorAll('.ant-slide-up-appear .ant-select-item-option-content')[0]
    );
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
      fireEvent.click(
        baseElement.querySelectorAll('.ant-slide-up-appear .ant-select-item-option-content')[1]
      );
    });
    expect(baseElement).toMatchSnapshot();

    expect(mockBeamboxPreferenceWrite).not.toBeCalled();
    expect(update).not.toBeCalled();
    expect(mockUnmount).not.toBeCalled();
    expect(mockChangeWorkarea).not.toBeCalled();
    mockQuerySelectorAll.mockReturnValueOnce([1]);
    fireEvent.click(getByText('Save'));
    expect(mockPopUp).toBeCalledTimes(1);
    expect(mockPopUp).toHaveBeenLastCalledWith({
      id: 'save-document-settings',
      message: 'Do you want to convert the Printing Layers into Laser Layers?',
      messageIcon: 'notice',
      buttonType: 'CONFIRM_CANCEL',
      onConfirm: expect.any(Function),
      onCancel: expect.any(Function),
    });
    const { onConfirm } = mockPopUp.mock.calls[0][0];
    onConfirm();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockBeamboxPreferenceWrite).toBeCalledTimes(9);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(1, 'engrave_dpi', 'high');
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(2, 'borderless', true);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(3, 'enable-diode', true);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(4, 'enable-autofocus', true);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(5, 'rotary_mode', 0);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(6, 'pass-through', true);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(7, 'pass-through-height', 500);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(8, 'enable-job-origin', 1);
    expect(mockBeamboxPreferenceWrite).toHaveBeenNthCalledWith(9, 'job-origin', 1);
    expect(mockChangeWorkarea).toBeCalledTimes(1);
    expect(mockChangeWorkarea).toHaveBeenLastCalledWith('fbm1', { toggleModule: true });
    expect(mockToggleDisplay).toBeCalledTimes(1);
    expect(mockTogglePresprayArea).toBeCalledTimes(1);
    expect(update).not.toBeCalled();
    expect(mockDiodeBoundaryDrawerShow).toBeCalledTimes(0);
    expect(mockDiodeBoundaryDrawerHide).toBeCalledTimes(0);
    expect(mockCreateEventEmitter).toBeCalledTimes(2);
    expect(mockCreateEventEmitter).toHaveBeenNthCalledWith(1, 'dpi-info');
    expect(mockCreateEventEmitter).toHaveBeenNthCalledWith(2, 'canvas');
    expect(mockEventEmitter.emit).toBeCalledTimes(2);
    expect(mockEventEmitter.emit).toHaveBeenNthCalledWith(1, 'UPDATE_DPI', 'high');
    expect(mockEventEmitter.emit).toHaveBeenNthCalledWith(2, 'document-settings-saved');
    expect(mockUnmount).toBeCalledTimes(1);
  });

  it('should render correctly for promark', async () => {
    document.querySelectorAll = mockQuerySelectorAll;
    const { baseElement, getByText } = render(<DocumentSettings unmount={mockUnmount} />);
    act(() => fireEvent.mouseDown(baseElement.querySelector('input#workareaSelect')));
    fireEvent.click(
      baseElement.querySelectorAll('.ant-slide-up-appear .ant-select-item-option-content')[5]
    );
    expect(baseElement.querySelector('input#customDimension')).toBeInTheDocument();
    act(() => fireEvent.mouseDown(baseElement.querySelector('input#customDimension')));
    fireEvent.click(
      baseElement.querySelectorAll('.ant-slide-up-appear .ant-select-item-option-content')[0]
    );
    expect(baseElement.querySelector('input#pm-laser-source')).toBeInTheDocument();
    act(() => fireEvent.mouseDown(baseElement.querySelector('input#pm-laser-source')));
    fireEvent.click(
      baseElement.querySelectorAll('.ant-slide-up-appear .ant-select-item-option-content')[4]
    );
    expect(baseElement.querySelector('input#frame_before_start')).not.toBeInTheDocument();
    expect(baseElement.querySelector('button#start_button')).toBeInTheDocument();
    act(() => fireEvent.click(baseElement.querySelector('button#start_button')));
    expect(baseElement.querySelector('input#frame_before_start')).toBeInTheDocument();
    fireEvent.click(baseElement.querySelector('input#frame_before_start'));
    fireEvent.click(baseElement.querySelector('.anticon-question-circle'));
    expect(mockOpen).toBeCalledTimes(1);

    expect(baseElement).toMatchSnapshot();
    mockQuerySelectorAll.mockReturnValueOnce([1]);
    fireEvent.click(getByText('Save'));
    expect(mockPopUp).toBeCalledTimes(1);
    expect(mockPopUp).toHaveBeenLastCalledWith({
      id: 'save-document-settings',
      message: 'Do you want to convert the Printing Layers into Laser Layers?',
      messageIcon: 'notice',
      buttonType: 'CONFIRM_CANCEL',
      onConfirm: expect.any(Function),
      onCancel: expect.any(Function),
    });
    const { onConfirm } = mockPopUp.mock.calls[0][0];
    onConfirm();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockBeamboxPreferenceWrite).toBeCalledTimes(12);
    expect(mockBeamboxPreferenceWrite).toHaveBeenCalledWith('customized-dimension', {
      fpm1: { width: 110, height: 110 },
    });
    expect(mockBeamboxPreferenceWrite).toHaveBeenCalledWith('promark-start-button', 1);
    expect(mockBeamboxPreferenceWrite).toHaveBeenCalledWith('frame-before-start', 1);
    expect(mockSetPromarkInfo).toBeCalledTimes(1);
    expect(mockSetPromarkInfo).toHaveBeenLastCalledWith({ laserType: LaserType.MOPA, watt: 60 });
  });
});
