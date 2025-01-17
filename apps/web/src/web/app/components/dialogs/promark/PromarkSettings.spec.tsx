import React, { act } from 'react';
import { fireEvent, render } from '@testing-library/react';

import { IDeviceInfo } from 'interfaces/IDevice';

import PromarkSettings from './PromarkSettings';

jest.mock('./FieldBlock', () => () => <div>Mock FieldBlock</div>);
jest.mock('./RedDotBlock', () => () => <div>Mock RedDotBlock</div>);
jest.mock('./LensBlock', () => () => <div>Mock LensBlock</div>);
jest.mock('./ParametersBlock', () => () => <div>Mock ParametersBlock</div>);

const mockCheckDeviceStatus = jest.fn();
jest.mock('helpers/check-device-status', () => ({
  checkDeviceStatus: (...args) => mockCheckDeviceStatus(...args),
}));

const mockSetGalvoParameters = jest.fn();
const mockSetField = jest.fn();
const mockStartFraming = jest.fn();
const mockStopFraming = jest.fn();
const mockDoPromarkCalibration = jest.fn();
const mockSelect = jest.fn();
jest.mock('helpers/device-master', () => ({
  setGalvoParameters: (...args) => mockSetGalvoParameters(...args),
  setField: (...args) => mockSetField(...args),
  startFraming: (...args) => mockStartFraming(...args),
  stopFraming: (...args) => mockStopFraming(...args),
  doPromarkCalibration: (...args) => mockDoPromarkCalibration(...args),
  select: (...args) => mockSelect(...args),
}));

const mockStorageGet = jest.fn();
jest.mock('implementations/storage', () => ({
  get: (...args) => mockStorageGet(...args),
}));

const mockPromarkUpdate = jest.fn();
jest.mock('helpers/device/promark/promark-data-store', () => ({
  update: (...args) => mockPromarkUpdate(...args),
}));

const mockGetWorkarea = jest.fn();
jest.mock('app/constants/workarea-constants', () => ({
  getWorkarea: (...args) => mockGetWorkarea(...args),
}));

const mockCalculateRedDotTransform = jest.fn();
const mockGenerateCalibrationTaskString = jest.fn();
const mockLoadTaskToSwiftray = jest.fn();
jest.mock('helpers/device/promark/calibration', () => ({
  calculateRedDotTransform: (...args) => mockCalculateRedDotTransform(...args),
  generateCalibrationTaskString: (...args) => mockGenerateCalibrationTaskString(...args),
  loadTaskToSwiftray: (...args) => mockLoadTaskToSwiftray(...args),
}));

const mockApplyRedDot = jest.fn();
jest.mock(
  'helpers/device/promark/apply-red-dot',
  () =>
    (...args) =>
      mockApplyRedDot(...args)
);

const mockOn = jest.fn();
const mockOff = jest.fn();
jest.mock('helpers/api/swiftray-client', () => ({
  swiftrayClient: {
    on: (...args) => mockOn(...args),
    off: (...args) => mockOff(...args),
  },
}));

const mockOnClose = jest.fn();

const mockDevice = {
  model: 'fpm1',
  serial: '123',
} as IDeviceInfo;

describe('test PromarkSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageGet.mockReturnValue('mm');
    mockGetWorkarea.mockReturnValue({ width: 150 });
  });

  it('should render correctly', () => {
    const { baseElement } = render(
      <PromarkSettings device={mockDevice} initData={{}} onClose={mockOnClose} />
    );
    expect(baseElement).toMatchSnapshot();
  });

  test('Preview button', async () => {
    const { findByText } = render(
      <PromarkSettings device={mockDevice} initData={{}} onClose={mockOnClose} />
    );
    mockGenerateCalibrationTaskString.mockReturnValue('task');
    const previewBtn = await findByText('Preview');
    expect(mockStartFraming).not.toBeCalled();
    expect(mockLoadTaskToSwiftray).not.toBeCalled();
    mockApplyRedDot.mockReturnValue({
      field: 'mock-field',
      galvoParameters: 'mock-galvoParameters',
    });

    await act(async () => fireEvent.click(previewBtn));
    expect(mockApplyRedDot).toBeCalledTimes(1);
    expect(mockApplyRedDot).toBeCalledWith(
      {
        offsetX: 0,
        offsetY: 0,
        scaleX: 1,
        scaleY: 1,
      },
      {
        offsetX: 0,
        offsetY: 0,
        angle: 0,
      },
      {
        x: { scale: 100, bulge: 1, skew: 1, trapezoid: 1 },
        y: { scale: 100, bulge: 1, skew: 1, trapezoid: 1 },
      }
    );
    expect(mockSetGalvoParameters).toBeCalledTimes(1);
    expect(mockSetGalvoParameters).toBeCalledWith('mock-galvoParameters');
    expect(mockSetField).toBeCalledTimes(1);
    expect(mockSetField).toBeCalledWith(150, 'mock-field');
    expect(mockGenerateCalibrationTaskString).toBeCalledTimes(1);
    expect(mockGenerateCalibrationTaskString).toBeCalledWith({
      width: 150,
    });
    expect(mockLoadTaskToSwiftray).toBeCalledTimes(1);
    expect(mockLoadTaskToSwiftray).toBeCalledWith('task', 'fpm1');
    expect(mockStartFraming).toBeCalledTimes(1);
    expect(mockStopFraming).not.toBeCalled();
    await act(async () => fireEvent.click(previewBtn));
    expect(mockStopFraming).toBeCalledTimes(1);
  });

  test('Mark button', async () => {
    const { findByText } = render(
      <PromarkSettings device={mockDevice} initData={{}} onClose={mockOnClose} />
    );
    mockGenerateCalibrationTaskString.mockReturnValue('task');
    const markBtn = await findByText('Mark');
    expect(mockLoadTaskToSwiftray).not.toBeCalled();
    expect(mockDoPromarkCalibration).not.toBeCalled();
    await act(() => fireEvent.click(markBtn));
    expect(mockGenerateCalibrationTaskString).toBeCalledTimes(1);
    expect(mockGenerateCalibrationTaskString).toBeCalledWith({
      width: 150,
      power: 50,
      speed: 1000,
    });
    expect(mockLoadTaskToSwiftray).toBeCalledTimes(1);
    expect(mockLoadTaskToSwiftray).toBeCalledWith('task', 'fpm1');
    expect(mockDoPromarkCalibration).toBeCalledTimes(1);
    expect(mockStartFraming).not.toBeCalled();
  });

  test('Cancel button', async () => {
    const { findByText } = render(
      <PromarkSettings device={mockDevice} initData={{}} onClose={mockOnClose} />
    );
    const cancelBtn = await findByText('Cancel');
    expect(mockOnClose).not.toBeCalled();
    fireEvent.click(cancelBtn);
    expect(mockOnClose).toBeCalledTimes(1);
  });

  test('Save button', async () => {
    const { findByText } = render(
      <PromarkSettings device={mockDevice} initData={{}} onClose={mockOnClose} />
    );
    const saveBtn = await findByText('Save');
    expect(mockPromarkUpdate).not.toBeCalled();
    await act(() => fireEvent.click(saveBtn));
    expect(mockPromarkUpdate).toBeCalledTimes(1);
    expect(mockPromarkUpdate).toBeCalledWith('123', {
      field: { offsetX: 0, offsetY: 0, angle: 0 },
      redDot: { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 },
      galvoParameters: {
        x: { scale: 100, bulge: 1, skew: 1, trapezoid: 1 },
        y: { scale: 100, bulge: 1, skew: 1, trapezoid: 1 },
      },
    });
    expect(mockOnClose).toBeCalledTimes(1);
  });
});
