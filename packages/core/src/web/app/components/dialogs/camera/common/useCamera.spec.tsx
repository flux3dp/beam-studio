import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import useCamera from './useCamera';

const mockPopUpError = jest.fn();
jest.mock('app/actions/alert-caller', () => ({
  popUpError: (...args) => mockPopUpError(...args),
}));

const mockTakeOnePicture = jest.fn();
const mockConnectCamera = jest.fn();
const mockDisconnectCamera = jest.fn();
const mockGetDeviceSetting = jest.fn();
jest.mock('helpers/device-master', () => ({
  takeOnePicture: (...args) => mockTakeOnePicture(...args),
  connectCamera: (...args) => mockConnectCamera(...args),
  disconnectCamera: (...args) => mockDisconnectCamera(...args),
  getDeviceSetting: (...args) => mockGetDeviceSetting(...args),
}));

const mockOpenNonstopProgress = jest.fn();
const mockPopById = jest.fn();
jest.mock('app/actions/progress-caller', () => ({
  openNonstopProgress: (...args) => mockOpenNonstopProgress(...args),
  popById: (...args) => mockPopById(...args),
}));

jest.mock('helpers/i18n', () => ({
  lang: {
    calibration: {
      taking_picture: 'taking_picture',
    },
  },
}));

const MockComponent = ({ handleImg }: { handleImg: (blob: Blob) => boolean }) => {
  const { exposureSetting, handleTakePicture } = useCamera(handleImg);
  return (
    <div>
      <p>exposureSetting: {JSON.stringify(exposureSetting)}</p>
      <button type="button" onClick={() => handleTakePicture()}>
        Take Picture
      </button>
    </div>
  );
};

const mockConsoleLog = jest.fn();

const mockHandleImg = jest.fn();
describe('test useCamera', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = mockConsoleLog;
  });

  test('init setup', async () => {
    mockGetDeviceSetting.mockResolvedValue({ value: JSON.stringify({ exposure: 100 }) });
    mockTakeOnePicture.mockResolvedValue({ imgBlob: new Blob() });
    mockHandleImg.mockReturnValue(true);

    const { container, unmount } = render(<MockComponent handleImg={mockHandleImg} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockConnectCamera).toBeCalledTimes(1);
    expect(mockGetDeviceSetting).toBeCalledTimes(1);
    expect(mockGetDeviceSetting).toBeCalledWith('camera_exposure_absolute');
    expect(mockOpenNonstopProgress).toBeCalledTimes(2);
    expect(mockOpenNonstopProgress).toBeCalledWith({
      id: 'use-camera',
      message: 'taking_picture',
    });
    expect(mockPopById).toBeCalledTimes(2);
    expect(mockTakeOnePicture).toBeCalledTimes(1);
    expect(mockHandleImg).toBeCalledTimes(1);
    expect(container).toMatchSnapshot();
    expect(mockDisconnectCamera).toBeCalledTimes(0);
    unmount();
    expect(mockDisconnectCamera).toBeCalledTimes(1);
  });

  test('handleTakePicture', async () => {
    mockGetDeviceSetting.mockResolvedValue({ value: JSON.stringify({ exposure: 100 }) });
    mockTakeOnePicture.mockResolvedValue({ imgBlob: new Blob() });
    mockHandleImg.mockReturnValue(true);

    const { getByText } = render(<MockComponent handleImg={mockHandleImg} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    jest.clearAllMocks();
    mockTakeOnePicture.mockResolvedValue({ imgBlob: new Blob() });
    mockHandleImg.mockReturnValue(true);
    fireEvent.click(getByText('Take Picture'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockOpenNonstopProgress).toBeCalledTimes(1);
    expect(mockOpenNonstopProgress).toBeCalledWith({
      id: 'use-camera',
      message: 'taking_picture',
    });
    expect(mockTakeOnePicture).toBeCalledTimes(1);
    expect(mockHandleImg).toBeCalledTimes(1);
    expect(mockPopById).toBeCalledTimes(1);
  });

  test('failed to get exposure setting', async () => {
    mockGetDeviceSetting.mockRejectedValue(new Error('error'));
    mockTakeOnePicture.mockResolvedValue({ imgBlob: new Blob() });
    mockHandleImg.mockReturnValue(true);
    const { container } = render(<MockComponent handleImg={mockHandleImg} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockConsoleLog).toBeCalledTimes(1);
    expect(mockConsoleLog).toBeCalledWith('Failed to get exposure setting', new Error('error'));
    expect(container).toMatchSnapshot();
  });

  test('failed to get image', async () => {
    mockGetDeviceSetting.mockResolvedValue({ value: JSON.stringify({ exposure: 100 }) });
    mockTakeOnePicture.mockResolvedValue({});
    mockHandleImg.mockReturnValue(true);
    render(<MockComponent handleImg={mockHandleImg} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockTakeOnePicture).toBeCalledTimes(3);
    expect(mockHandleImg).not.toBeCalled();
    expect(mockPopUpError).toBeCalledTimes(1);
    expect(mockPopUpError).toBeCalledWith({ message: 'Unable to get image' });
  });

  test('unstable get image', async () => {
    mockGetDeviceSetting.mockResolvedValue({ value: JSON.stringify({ exposure: 100 }) });
    mockTakeOnePicture
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ imgBlob: new Blob() });
    mockHandleImg.mockReturnValue(true);
    render(<MockComponent handleImg={mockHandleImg} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockTakeOnePicture).toBeCalledTimes(3);
    expect(mockHandleImg).toBeCalledTimes(1);
    expect(mockPopUpError).not.toBeCalled();
  });

  test('unstable handle image', async () => {
    mockGetDeviceSetting.mockResolvedValue({ value: JSON.stringify({ exposure: 100 }) });
    mockTakeOnePicture.mockResolvedValue({ imgBlob: new Blob() });

    mockHandleImg.mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<MockComponent handleImg={mockHandleImg} />);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockTakeOnePicture).toBeCalledTimes(3);
    expect(mockHandleImg).toBeCalledTimes(3);
    expect(mockPopUpError).not.toBeCalled();
  });
});
