import React, { act } from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import ConnectionTest from './ConnectionTest';

jest.useFakeTimers();

jest.mock('@core/app/constants/workarea-constants', () => ({
  getWorkarea: () => ({ width: 110 }),
}));

const mockOn = jest.fn();
const mockOff = jest.fn();

jest.mock('@core/helpers/api/swiftray-client', () => ({
  swiftrayClient: {
    off: (...args) => mockOff(...args),
    on: (...args) => mockOn(...args),
  },
}));

const mockGenerateCalibrationTaskString = jest.fn().mockResolvedValue('mock-task');
const mockLoadTaskToSwiftray = jest.fn();

jest.mock('@core/helpers/device/promark/calibration', () => ({
  generateCalibrationTaskString: (...args) => mockGenerateCalibrationTaskString(...args),
  loadTaskToSwiftray: (...args) => mockLoadTaskToSwiftray(...args),
}));

const mockStartFraming = jest.fn();
const mockStopFraming = jest.fn();
const mockGetReport = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  getReport: (...args) => mockGetReport(...args),
  startFraming: (...args) => mockStartFraming(...args),
  stopFraming: (...args) => mockStopFraming(...args),
}));

const mockDevice: any = { model: 'fbm1' };
const mockOnclose = jest.fn();

describe('test ConnectionTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', async () => {
    const { baseElement, getByText } = render(<ConnectionTest device={mockDevice} onClose={mockOnclose} />);

    expect(baseElement).toMatchSnapshot();

    // Good result
    mockGetReport.mockResolvedValue({ disconnection: 0 });

    const startButton = getByText('Start Test');

    expect(startButton).toBeInTheDocument();
    fireEvent.click(startButton);
    await waitFor(() => {
      expect(mockGenerateCalibrationTaskString).toHaveBeenCalledTimes(1);
      expect(mockLoadTaskToSwiftray).toHaveBeenCalledTimes(1);
      expect(mockStartFraming).toHaveBeenCalledTimes(1);
    });

    const cancelButton = getByText('Stop Test');

    expect(cancelButton).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(120000));
    await waitFor(() => {
      expect(mockStopFraming).toHaveBeenCalledTimes(1);
      expect(mockGetReport).toHaveBeenCalledTimes(1);
    });
    expect(baseElement).toMatchSnapshot();

    // Bad result
    mockGetReport.mockResolvedValue({ disconnection: -1 });

    const restartButton = getByText('Restart Test');

    expect(restartButton).toBeInTheDocument();
    fireEvent.click(restartButton);
    await waitFor(() => {
      expect(mockGenerateCalibrationTaskString).toHaveBeenCalledTimes(1);
      expect(mockLoadTaskToSwiftray).toHaveBeenCalledTimes(2);
      expect(mockStartFraming).toHaveBeenCalledTimes(2);
    });
    act(() => jest.advanceTimersByTime(120000));
    await waitFor(() => {
      expect(mockStopFraming).toHaveBeenCalledTimes(2);
      expect(mockGetReport).toHaveBeenCalledTimes(2);
    });
    expect(baseElement).toMatchSnapshot();
  });
});
