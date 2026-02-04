import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import useCamera from './useCamera';

const mockPopUpError = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUpError: (...args) => mockPopUpError(...args),
}));

const mockGetExposureSettings = jest.fn();

jest.mock('@core/helpers/device/camera/cameraExposure', () => ({
  getExposureSettings: (...args) => mockGetExposureSettings(...args),
}));

const mockTakeOnePicture = jest.fn();
const mockConnectCamera = jest.fn();
const mockDisconnectCamera = jest.fn();
const mockGetCurrentDevice = jest.fn();
const mockGetCameraExposureAuto = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  connectCamera: (...args) => mockConnectCamera(...args),
  get currentDevice() {
    return mockGetCurrentDevice();
  },
  disconnectCamera: (...args) => mockDisconnectCamera(...args),
  getCameraExposureAuto: (...args) => mockGetCameraExposureAuto(...args),
  takeOnePicture: (...args) => mockTakeOnePicture(...args),
}));

const mockOpenNonstopProgress = jest.fn();
const mockPopById = jest.fn();

jest.mock('@core/app/actions/progress-caller', () => ({
  openNonstopProgress: (...args) => mockOpenNonstopProgress(...args),
  popById: (...args) => mockPopById(...args),
}));

const mockMeetRequirement = jest.fn();

jest.mock('@core/helpers/version-checker', () => () => ({
  meetRequirement: (...reqArgs) => mockMeetRequirement(...reqArgs),
}));

jest.mock('@core/app/actions/beambox/constant', () => ({
  supportCameraAutoExposureModels: ['fbb2', 'fhx2rf'],
}));

const MockComponent = ({ handleImg }: { handleImg: (blob: Blob) => boolean }) => {
  const { autoExposure, exposureSetting, handleTakePicture } = useCamera(handleImg);

  return (
    <div>
      <p>autoExposure: {JSON.stringify(autoExposure)}</p>
      <p>exposureSetting: {JSON.stringify(exposureSetting)}</p>
      <button onClick={() => handleTakePicture()} type="button">
        Take Picture
      </button>
    </div>
  );
};

const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();

const mockHandleImg = jest.fn();

describe('test useCamera', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = mockConsoleLog;
    console.error = mockConsoleError;
    mockGetCurrentDevice.mockReturnValue({ info: { model: 'fbb1', version: '1.0.0' } });
  });

  test('init setup', async () => {
    mockGetExposureSettings.mockResolvedValue({ max: 1000, min: 50, step: 1, value: 100 });
    mockTakeOnePicture.mockResolvedValue({ imgBlob: new Blob() });
    mockHandleImg.mockReturnValue(true);

    const { container, unmount } = render(<MockComponent handleImg={mockHandleImg} />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockConnectCamera).toHaveBeenCalledTimes(1);
    expect(mockGetExposureSettings).toHaveBeenCalledTimes(1);
    expect(mockOpenNonstopProgress).toHaveBeenCalledTimes(2);
    expect(mockOpenNonstopProgress).toHaveBeenCalledWith({
      id: 'use-camera',
      message: 'Taking Picture...',
    });
    expect(mockPopById).toHaveBeenCalledTimes(2);
    expect(mockTakeOnePicture).toHaveBeenCalledTimes(1);
    expect(mockHandleImg).toHaveBeenCalledTimes(1);
    expect(container).toMatchSnapshot();
    expect(mockDisconnectCamera).toHaveBeenCalledTimes(0);
    unmount();
    expect(mockDisconnectCamera).toHaveBeenCalledTimes(1);
  });

  test('handleTakePicture', async () => {
    mockGetExposureSettings.mockResolvedValue({ max: 1000, min: 50, step: 1, value: 100 });
    mockTakeOnePicture.mockResolvedValue({ imgBlob: new Blob() });
    mockHandleImg.mockReturnValue(true);

    const { getByText } = render(<MockComponent handleImg={mockHandleImg} />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    jest.clearAllMocks();
    mockTakeOnePicture.mockResolvedValue({ imgBlob: new Blob() });
    mockHandleImg.mockReturnValue(true);
    fireEvent.click(getByText('Take Picture'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockOpenNonstopProgress).toHaveBeenCalledTimes(1);
    expect(mockOpenNonstopProgress).toHaveBeenCalledWith({
      id: 'use-camera',
      message: 'Taking Picture...',
    });
    expect(mockTakeOnePicture).toHaveBeenCalledTimes(1);
    expect(mockHandleImg).toHaveBeenCalledTimes(1);
    expect(mockPopById).toHaveBeenCalledTimes(1);
  });

  test('failed to get exposure setting', async () => {
    mockGetExposureSettings.mockRejectedValue(new Error('error'));
    mockTakeOnePicture.mockResolvedValue({ imgBlob: new Blob() });
    mockHandleImg.mockReturnValue(true);

    const { container } = render(<MockComponent handleImg={mockHandleImg} />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    expect(mockConsoleLog).toHaveBeenCalledWith('Failed to get exposure setting', new Error('error'));
    expect(container).toMatchSnapshot();
  });

  test('failed to get image', async () => {
    mockGetExposureSettings.mockResolvedValue({ max: 1000, min: 50, step: 1, value: 100 });
    mockTakeOnePicture.mockResolvedValue({});
    mockHandleImg.mockReturnValue(true);
    render(<MockComponent handleImg={mockHandleImg} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockTakeOnePicture).toHaveBeenCalledTimes(3);
    expect(mockHandleImg).not.toHaveBeenCalled();
    expect(mockPopUpError).toHaveBeenCalledTimes(1);
    expect(mockPopUpError).toHaveBeenCalledWith({ message: 'Unable to get image' });
  });

  test('unstable get image', async () => {
    mockGetExposureSettings.mockResolvedValue({ max: 1000, min: 50, step: 1, value: 100 });
    mockTakeOnePicture
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ imgBlob: new Blob() });
    mockHandleImg.mockReturnValue(true);
    render(<MockComponent handleImg={mockHandleImg} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockTakeOnePicture).toHaveBeenCalledTimes(3);
    expect(mockHandleImg).toHaveBeenCalledTimes(1);
    expect(mockPopUpError).not.toHaveBeenCalled();
  });

  test('unstable handle image', async () => {
    mockGetExposureSettings.mockResolvedValue({ max: 1000, min: 50, step: 1, value: 100 });
    mockTakeOnePicture.mockResolvedValue({ imgBlob: new Blob() });

    mockHandleImg.mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<MockComponent handleImg={mockHandleImg} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockTakeOnePicture).toHaveBeenCalledTimes(3);
    expect(mockHandleImg).toHaveBeenCalledTimes(3);
    expect(mockPopUpError).not.toHaveBeenCalled();
  });

  describe('getAutoExposure', () => {
    it('should get auto exposure as true', async () => {
      mockGetCurrentDevice.mockReturnValue({ info: { model: 'fhx2rf', version: '1.0.0' } });
      mockGetExposureSettings.mockResolvedValue({ max: 1000, min: 50, step: 1, value: 100 });
      mockGetCameraExposureAuto.mockResolvedValue({ data: true, success: true });
      mockTakeOnePicture.mockResolvedValue({ imgBlob: new Blob() });
      mockHandleImg.mockReturnValue(true);

      const { container } = render(<MockComponent handleImg={mockHandleImg} />);

      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mockGetCameraExposureAuto).toHaveBeenCalledTimes(1);
      expect(container.textContent).toContain('autoExposure: true');
    });

    it('should get auto exposure as false', async () => {
      mockGetCurrentDevice.mockReturnValue({ info: { model: 'fhx2rf', version: '1.0.0' } });
      mockGetExposureSettings.mockResolvedValue({ max: 1000, min: 50, step: 1, value: 100 });
      mockGetCameraExposureAuto.mockResolvedValue({ data: false, success: true });
      mockTakeOnePicture.mockResolvedValue({ imgBlob: new Blob() });
      mockHandleImg.mockReturnValue(true);

      const { container } = render(<MockComponent handleImg={mockHandleImg} />);

      await waitFor(() => {
        expect(mockGetCameraExposureAuto).toHaveBeenCalledTimes(1);
      });
      expect(container.textContent).toContain('autoExposure: false');
    });

    it('should not get auto exposure for unsupported model', async () => {
      mockGetCurrentDevice.mockReturnValue({ info: { model: 'fbb1', version: '1.0.0' } });
      mockGetExposureSettings.mockResolvedValue({ max: 1000, min: 50, step: 1, value: 100 });
      mockTakeOnePicture.mockResolvedValue({ imgBlob: new Blob() });
      mockHandleImg.mockReturnValue(true);

      const { container } = render(<MockComponent handleImg={mockHandleImg} />);

      await new Promise((resolve) => setTimeout(resolve));
      expect(mockGetCameraExposureAuto).not.toHaveBeenCalled();
      expect(container.textContent).toContain('autoExposure: null');
    });

    it('should get auto exposure for fbb2 model with valid version', async () => {
      mockGetCurrentDevice.mockReturnValue({ info: { model: 'fbb2', version: '2.0.0' } });
      mockMeetRequirement.mockReturnValue(true);
      mockGetExposureSettings.mockResolvedValue({ max: 1000, min: 50, step: 1, value: 100 });
      mockGetCameraExposureAuto.mockResolvedValue({ data: true, success: true });
      mockTakeOnePicture.mockResolvedValue({ imgBlob: new Blob() });
      mockHandleImg.mockReturnValue(true);

      const { container } = render(<MockComponent handleImg={mockHandleImg} />);

      await new Promise((resolve) => setTimeout(resolve));
      expect(mockMeetRequirement).toHaveBeenCalledWith('BB2_AUTO_EXPOSURE');
      expect(mockGetCameraExposureAuto).toHaveBeenCalledTimes(1);
      expect(container.textContent).toContain('autoExposure: true');
    });

    it('should not get auto exposure for fbb2 model with invalid version', async () => {
      mockGetCurrentDevice.mockReturnValue({ info: { model: 'fbb2', version: '1.0.0' } });
      mockMeetRequirement.mockReturnValue(false);
      mockGetExposureSettings.mockResolvedValue({ max: 1000, min: 50, step: 1, value: 100 });
      mockTakeOnePicture.mockResolvedValue({ imgBlob: new Blob() });
      mockHandleImg.mockReturnValue(true);

      const { container } = render(<MockComponent handleImg={mockHandleImg} />);

      await new Promise((resolve) => setTimeout(resolve));
      expect(mockMeetRequirement).toHaveBeenCalledWith('BB2_AUTO_EXPOSURE');
      expect(mockGetCameraExposureAuto).not.toHaveBeenCalled();
      expect(container.textContent).toContain('autoExposure: null');
    });
  });
});
