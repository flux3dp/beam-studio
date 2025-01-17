import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';

import StepCrop from './StepCrop';

const mockCropper = jest.fn();
jest.mock('cropperjs', () => function MockCropper(...args) {
  return mockCropper(...args);
});

const mockDestroy = jest.fn();
const mockGetData = jest.fn();
const mockGetCroppedCanvas = jest.fn();

const mockGetCameraCanvasUrl = jest.fn();
const mockGetCoordinates = jest.fn();
jest.mock('app/actions/beambox/preview-mode-background-drawer', () => ({
  getCoordinates: () => mockGetCoordinates(),
  getCameraCanvasUrl: () => mockGetCameraCanvasUrl(),
}));

jest.mock('helpers/i18n', () => ({
  lang: {
    beambox: {
      image_trace_panel: {
        next: 'next',
      },
    },
  },
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
      getData: mockGetData,
      getCroppedCanvas: mockGetCroppedCanvas,
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
      minX: 0,
      maxX: 100,
      minY: 0,
      maxY: 100
    });
    mockGetCameraCanvasUrl.mockReturnValue('mock-camera-canvas');
    const { baseElement } = render(
      <StepCrop onCancel={mockOnCancel} onCropFinish={mockOnCropFinish} />
    );
    expect(mockGetCoordinates).toBeCalledTimes(1);
    expect(mockGetCameraCanvasUrl).toBeCalledTimes(1);
    expect(mockDrawImage).toBeCalledTimes(1);
    expect(mockDrawImage).toHaveBeenLastCalledWith(expect.anything(), 0, 0, 100, 100, 0, 0, 100, 100);

    expect(mockToBlob).toBeCalledTimes(1);
    expect(mockCreateObjectURL).not.toBeCalled();
    mockCreateObjectURL.mockReturnValue('mock-object-url');
    const [callback] = mockToBlob.mock.calls[0];
    expect(baseElement).toMatchSnapshot();
    await act(async () => callback('mock-blob'));
    expect(mockCreateObjectURL).toBeCalledTimes(1);
    expect(mockCreateObjectURL).toHaveBeenLastCalledWith('mock-blob');
    expect(baseElement).toMatchSnapshot();
  });

  test('cropper should work', async () => {
    mockGetCoordinates.mockReturnValue({
      minX: 0,
      maxX: 100,
      minY: 0,
      maxY: 100
    });
    mockGetCameraCanvasUrl.mockReturnValue('mock-camera-canvas');
    const { baseElement, getByText } = render(
      <StepCrop onCancel={mockOnCancel} onCropFinish={mockOnCropFinish} />
    );
    mockCreateObjectURL.mockReturnValue('mock-object-url');
    await act(async () => mockToBlob.mock.calls[0][0]('mock-blob'));
    const img = baseElement.querySelector('img');
    fireEvent.load(img);
    expect(mockGetData).not.toBeCalled();
    mockGetData.mockReturnValue('mock-data');
    expect(mockGetCroppedCanvas).not.toBeCalled();
    mockGetCroppedCanvas.mockReturnValue({ toBlob: mockToBlob });
    expect(mockCropper).toBeCalledTimes(1);
    fireEvent.click(getByText('next'));
    expect(mockGetData).toBeCalledTimes(1);
    expect(mockGetCroppedCanvas).toBeCalledTimes(1);
    expect(mockToBlob).toBeCalledTimes(2);
    mockToBlob.mock.calls[1][0]('mock-blob2');
    expect(mockCreateObjectURL).toBeCalledTimes(2);
    expect(mockCreateObjectURL).toHaveBeenLastCalledWith('mock-blob2');
    expect(mockOnCropFinish).toBeCalledTimes(1);
    expect(mockOnCropFinish).toHaveBeenLastCalledWith('mock-data', 'mock-object-url');
  });
});
