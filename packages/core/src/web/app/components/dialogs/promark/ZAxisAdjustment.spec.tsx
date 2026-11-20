import React, { act } from 'react';

import { fireEvent, render } from '@testing-library/react';

import { ZAxisAdjustment } from './ZAxisAdjustment';

// only showZAxisAdjustment uses these, and they pull in most of the app
jest.mock('@core/helpers/check-device-status', () => jest.fn());
jest.mock('@core/app/actions/dialog-controller', () => ({}));
jest.mock('@core/app/actions/alert-caller', () => ({ popUp: jest.fn() }));

jest.mock('@core/helpers/api/swiftray-client', () => ({
  swiftrayClient: { off: jest.fn(), on: jest.fn() },
}));

const mockLoadTaskToSwiftray = jest.fn();

jest.mock('@core/helpers/device/promark/calibration', () => ({
  generateCalibrationTaskString: async () => 'mock-task',
  loadTaskToSwiftray: (...args) => mockLoadTaskToSwiftray(...args),
}));

const mockStartFraming = jest.fn();
const mockStopFraming = jest.fn();
const mockDoPromarkCalibration = jest.fn();
const mockAdjustZAxis = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  adjustZAxis: (...args) => mockAdjustZAxis(...args),
  doPromarkCalibration: (...args) => mockDoPromarkCalibration(...args),
  startFraming: (...args) => mockStartFraming(...args),
  stopFraming: (...args) => mockStopFraming(...args),
  waitTillStatusPredicate: jest.fn(),
}));

const mockApplyLensProfile = jest.fn();
const laserLens = { field: 'laser-field', galvoParameters: 'laser-galvo', worksize: 200 };
const redLightLens = { field: 'red-field', galvoParameters: 'red-galvo', worksize: 200 };
const mockGetJobLens = jest.fn((_device, options?: { redDot?: boolean }) =>
  options?.redDot ? redLightLens : laserLens,
);

jest.mock('@core/helpers/device/promark/apply-lens-profile', () => ({
  applyLensProfile: (...args) => mockApplyLensProfile(...args),
  getJobLens: (...args: [unknown, { redDot?: boolean }?]) => mockGetJobLens(...args),
}));

jest.mock('./ParametersBlock', () => () => <div>Mock ParametersBlock</div>);

const mockDevice: any = { model: 'fpm1', serial: 'serial' };

describe('test ZAxisAdjustment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApplyLensProfile.mockResolvedValue(true);
  });

  it('should send the document lens with the red dot correction before and with the preview', async () => {
    const { getByText } = render(<ZAxisAdjustment device={mockDevice} onClose={jest.fn()} />);

    await act(async () => fireEvent.click(getByText('Preview')));
    expect(mockApplyLensProfile).toHaveBeenCalledWith(expect.anything(), mockDevice, { redDot: true });
    expect(mockStartFraming).toHaveBeenCalledWith(undefined, redLightLens);
    expect(mockApplyLensProfile.mock.invocationCallOrder[0]).toBeLessThan(mockStartFraming.mock.invocationCallOrder[0]);
    expect(mockLoadTaskToSwiftray.mock.invocationCallOrder[0]).toBeLessThan(
      mockApplyLensProfile.mock.invocationCallOrder[0],
    );

    // previewing: the next click stops it
    await act(async () => fireEvent.click(getByText('Preview')));
    expect(mockStopFraming).toHaveBeenCalledTimes(1);
    expect(mockStartFraming).toHaveBeenCalledTimes(1);
  });

  it('should send the lens again for every preview', async () => {
    const { getByText } = render(<ZAxisAdjustment device={mockDevice} onClose={jest.fn()} />);

    await act(async () => fireEvent.click(getByText('Preview')));
    await act(async () => fireEvent.click(getByText('Preview')));
    await act(async () => fireEvent.click(getByText('Preview')));
    expect(mockApplyLensProfile).toHaveBeenCalledTimes(2);
    expect(mockStartFraming).toHaveBeenCalledTimes(2);
  });

  it('should not start the preview when the machine refuses the lens', async () => {
    mockApplyLensProfile.mockResolvedValue(false);

    const { getByText } = render(<ZAxisAdjustment device={mockDevice} onClose={jest.fn()} />);

    await act(async () => fireEvent.click(getByText('Preview')));
    expect(mockStartFraming).not.toHaveBeenCalled();
  });

  it('should not show a preview that Swiftray refused to start', async () => {
    mockStartFraming.mockRejectedValueOnce(Object.assign(new Error('refused'), { error: ['JOB_RUNNING'] }));

    const { getByText } = render(<ZAxisAdjustment device={mockDevice} onClose={jest.fn()} />);

    await act(async () => fireEvent.click(getByText('Preview')));
    // not previewing: the next click starts again instead of stopping
    await act(async () => fireEvent.click(getByText('Preview')));
    expect(mockStopFraming).not.toHaveBeenCalled();
    expect(mockStartFraming).toHaveBeenCalledTimes(2);
  });

  it('should mark with the document lens without the red dot correction', async () => {
    const { getByText } = render(<ZAxisAdjustment device={mockDevice} onClose={jest.fn()} />);

    await act(async () => fireEvent.click(getByText('Mark')));
    expect(mockApplyLensProfile).toHaveBeenCalledWith(expect.anything(), mockDevice);
    expect(mockDoPromarkCalibration).toHaveBeenCalledWith(laserLens);
    expect(mockApplyLensProfile.mock.invocationCallOrder[0]).toBeLessThan(
      mockDoPromarkCalibration.mock.invocationCallOrder[0],
    );
  });

  it('should take the red dot correction of a running preview back off before marking', async () => {
    const { getByText } = render(<ZAxisAdjustment device={mockDevice} onClose={jest.fn()} />);

    await act(async () => fireEvent.click(getByText('Preview')));
    await act(async () => fireEvent.click(getByText('Mark')));
    expect(mockStopFraming).toHaveBeenCalledTimes(1);
    expect(mockApplyLensProfile).toHaveBeenLastCalledWith(expect.anything(), mockDevice);
    expect(mockDoPromarkCalibration).toHaveBeenCalledWith(laserLens);
  });

  it('should not mark when the machine refuses the lens', async () => {
    mockApplyLensProfile.mockResolvedValue(false);

    const { getByText } = render(<ZAxisAdjustment device={mockDevice} onClose={jest.fn()} />);

    await act(async () => fireEvent.click(getByText('Mark')));
    expect(mockDoPromarkCalibration).not.toHaveBeenCalled();
  });

  it('should move the z axis without touching the lens', async () => {
    const { baseElement } = render(<ZAxisAdjustment device={mockDevice} onClose={jest.fn()} />);

    await act(async () => fireEvent.click(baseElement.querySelector('.anticon-arrow-up')!.closest('button')!));
    expect(mockAdjustZAxis).toHaveBeenCalledWith(1);
    expect(mockApplyLensProfile).not.toHaveBeenCalled();
  });
});
