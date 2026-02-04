import React from 'react';

import { act, fireEvent, render } from '@testing-library/react';

import StepCrop from './StepCrop';

const mockCropper = jest.fn();

jest.mock(
  'cropperjs',
  () =>
    function MockCropper(...args) {
      return mockCropper(...args);
    },
);

const mockDestroy = jest.fn();
const mockGetData = jest.fn();
const mockGetCroppedCanvas = jest.fn();

const mockGetCameraCanvasUrl = jest.fn();
const mockGetCoordinates = jest.fn();

jest.mock('@core/app/actions/beambox/preview-mode-background-drawer', () => ({
  getCameraCanvasUrl: () => mockGetCameraCanvasUrl(),
  getCoordinates: () => mockGetCoordinates(),
}));

const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

const mockOnCancel = jest.fn();
const mockOnCropFinish = jest.fn();

const mockDrawImage = jest.fn();
const mockContext = {
  drawImage: mockDrawImage,
};
const mockToBlob = jest.fn();

describe('test StepCrop', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCropper.mockImplementation(() => ({
      destroy: mockDestroy,
      getCroppedCanvas: mockGetCroppedCanvas,
      getData: mockGetData,
    }));
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // @ts-expect-error mocking image to test onload
    global.Image = class {
      private onloadCallback: () => void = () => {};

      set onload(callback: () => void) {
        this.onloadCallback = callback;
      }

      set src(url: string) {
        this.onloadCallback();
      }
    };
    // @ts-expect-error mocking canvas
    HTMLCanvasElement.prototype.getContext = () => mockContext;
    HTMLCanvasElement.prototype.toBlob = mockToBlob;
  });

  it('should render correctly', async () => {
    mockGetCoordinates.mockReturnValue({
      maxX: 100,
      maxY: 100,
      minX: 0,
      minY: 0,
    });
    mockGetCameraCanvasUrl.mockResolvedValue('mock-camera-canvas');

    const { baseElement } = render(<StepCrop onCancel={mockOnCancel} onCropFinish={mockOnCropFinish} />);

    await new Promise((resolve) => setTimeout(resolve, 0)); // wait for initImage to complete
    expect(mockGetCoordinates).toHaveBeenCalledTimes(1);
    expect(mockGetCameraCanvasUrl).toHaveBeenCalledTimes(1);
    expect(mockDrawImage).toHaveBeenCalledTimes(1);
    expect(mockDrawImage).toHaveBeenLastCalledWith(expect.anything(), 0, 0, 100, 100, 0, 0, 100, 100);

    expect(mockToBlob).toHaveBeenCalledTimes(1);
    expect(mockCreateObjectURL).not.toHaveBeenCalled();
    mockCreateObjectURL.mockReturnValue('mock-object-url');

    const [callback] = mockToBlob.mock.calls[0];

    expect(baseElement).toMatchSnapshot();
    await act(async () => callback('mock-blob'));
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    expect(mockCreateObjectURL).toHaveBeenLastCalledWith('mock-blob');
    expect(baseElement).toMatchSnapshot();
  });

  test('cropper should work', async () => {
    mockGetCoordinates.mockReturnValue({
      maxX: 100,
      maxY: 100,
      minX: 0,
      minY: 0,
    });
    mockGetCameraCanvasUrl.mockResolvedValue('mock-camera-canvas');

    const { baseElement, getByText } = render(<StepCrop onCancel={mockOnCancel} onCropFinish={mockOnCropFinish} />);

    await new Promise((resolve) => setTimeout(resolve, 0)); // wait for initImage to complete
    mockCreateObjectURL.mockReturnValue('mock-object-url');
    await act(async () => mockToBlob.mock.calls[0][0]('mock-blob'));

    const img = baseElement.querySelector('img');

    fireEvent.load(img);
    expect(mockGetData).not.toHaveBeenCalled();
    mockGetData.mockReturnValue('mock-data');
    expect(mockGetCroppedCanvas).not.toHaveBeenCalled();
    mockGetCroppedCanvas.mockReturnValue({ toBlob: mockToBlob });
    expect(mockCropper).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText('Next'));
    expect(mockGetData).toHaveBeenCalledTimes(1);
    expect(mockGetCroppedCanvas).toHaveBeenCalledTimes(1);
    expect(mockToBlob).toHaveBeenCalledTimes(2);
    mockToBlob.mock.calls[1][0]('mock-blob2');
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(2);
    expect(mockCreateObjectURL).toHaveBeenLastCalledWith('mock-blob2');
    expect(mockOnCropFinish).toHaveBeenCalledTimes(1);
    expect(mockOnCropFinish).toHaveBeenLastCalledWith('mock-data', 'mock-object-url');
  });
});
