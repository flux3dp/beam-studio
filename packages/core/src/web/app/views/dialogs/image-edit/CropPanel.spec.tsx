import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';

import CropPanel from './CropPanel';

const mockCropper = jest.fn();
jest.mock(
  'cropperjs',
  () =>
    function Cropper(...args) {
      return mockCropper(...args);
    }
);

const mockCalculateBase64 = jest.fn();
jest.mock(
  'helpers/image-edit-panel/calculate-base64',
  () =>
    (...args) =>
      mockCalculateBase64(...args)
);

const mockHandleFinish = jest.fn();
jest.mock(
  'helpers/image-edit-panel/handle-finish',
  () =>
    (...args) =>
      mockHandleFinish(...args)
);

const mockCropImage = jest.fn();
jest.mock('helpers/jimp-helper', () => ({
  cropImage: (...args) => mockCropImage(...args),
}));

const mockOpenNonstopProgress = jest.fn();
const mockPopById = jest.fn();
jest.mock('app/actions/progress-caller', () => ({
  openNonstopProgress: (...args) => mockOpenNonstopProgress(...args),
  popById: (...args) => mockPopById(...args),
}));

const mockPreprocessByUrl = jest.fn();
jest.mock('helpers/image-edit-panel/preprocess', () => ({
  preprocessByUrl: (...args) => mockPreprocessByUrl(...args),
}));

const useIsMobile = jest.fn();
jest.mock('helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

const mockRevokeObjectURL = jest.fn();

const mockImage = {
  getAttribute: jest.fn(),
};
const mockOnClose = jest.fn();

describe('test CropPanel', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    mockImage.getAttribute.mockImplementation((key) => {
      if (key === 'data-shading') return 'true';
      if (key === 'data-threshold') return '125';
      if (key === 'data-fullcolor') return null;
      if (key === 'width') return '200';
      if (key === 'height') return '200';
      if (key === 'x') return '100';
      if (key === 'y') return '100';
      return undefined;
    });
  });

  it('should render correctly', async () => {
    mockPreprocessByUrl.mockResolvedValue({
      blobUrl: 'mock-url-1',
      dimension: { x: 0, y: 0, width: 100, height: 100 },
      originalWidth: 200,
      originalHeight: 200,
    });
    mockCalculateBase64.mockResolvedValueOnce('mock-base64-1');
    const { baseElement } = render(
      <CropPanel
        src="mock-src"
        image={mockImage as unknown as SVGImageElement}
        onClose={mockOnClose}
      />
    );
    await waitFor(() => {
      expect(mockOpenNonstopProgress).toBeCalledTimes(1);
      expect(mockOpenNonstopProgress).toHaveBeenLastCalledWith({
        id: 'photo-edit-processing',
        message: 'Processing',
      });
      expect(mockPreprocessByUrl).toBeCalledTimes(1);
      expect(mockPreprocessByUrl).toHaveBeenLastCalledWith('mock-src');
      expect(mockCalculateBase64).toBeCalledTimes(1);
      expect(mockCalculateBase64).toHaveBeenLastCalledWith('mock-url-1', true, 125, false);
      expect(mockPopById).toBeCalledTimes(1);
      expect(mockPopById).toHaveBeenLastCalledWith('photo-edit-processing');
    });
    await waitFor(() =>
      expect(baseElement.querySelector('.ant-modal')).not.toHaveClass('ant-zoom-appear')
    );
    expect(baseElement).toMatchSnapshot();
  });

  it('should render correctly when image is full color', async () => {
    mockPreprocessByUrl.mockResolvedValue({
      blobUrl: 'mock-url-1',
      dimension: { x: 0, y: 0, width: 100, height: 100 },
      originalWidth: 200,
      originalHeight: 200,
    });
    mockImage.getAttribute.mockReset();
    mockImage.getAttribute
      .mockReturnValueOnce('true')
      .mockReturnValueOnce('125')
      .mockReturnValueOnce('1')
      .mockReturnValueOnce('200')
      .mockReturnValueOnce('200');
    mockCalculateBase64.mockResolvedValueOnce('mock-base64-1');
    const { baseElement } = render(
      <CropPanel
        src="mock-src"
        image={mockImage as unknown as SVGImageElement}
        onClose={mockOnClose}
      />
    );
    await waitFor(() => {
      expect(mockOpenNonstopProgress).toBeCalledTimes(1);
      expect(mockOpenNonstopProgress).toHaveBeenLastCalledWith({
        id: 'photo-edit-processing',
        message: 'Processing',
      });
      expect(mockPreprocessByUrl).toBeCalledTimes(1);
      expect(mockPreprocessByUrl).toHaveBeenLastCalledWith('mock-src');
      expect(mockCalculateBase64).toBeCalledTimes(1);
      expect(mockCalculateBase64).toHaveBeenLastCalledWith('mock-url-1', true, 125, true);
      expect(mockPopById).toBeCalledTimes(1);
      expect(mockPopById).toHaveBeenLastCalledWith('photo-edit-processing');
    });
    await waitFor(() =>
      expect(baseElement.querySelector('.ant-modal')).not.toHaveClass('ant-zoom-appear')
    );
    expect(baseElement).toMatchSnapshot();
  });

  it('should render correctly in mobile', async () => {
    useIsMobile.mockReturnValue(true);
    mockPreprocessByUrl.mockResolvedValue({
      blobUrl: 'mock-url-1',
      dimension: { x: 0, y: 0, width: 100, height: 100 },
      originalWidth: 200,
      originalHeight: 200,
    });
    mockCalculateBase64.mockResolvedValueOnce('mock-base64-1');
    const { baseElement } = render(
      <CropPanel
        src="mock-src"
        image={mockImage as unknown as SVGImageElement}
        onClose={mockOnClose}
      />
    );
    await waitFor(() => {
      expect(mockOpenNonstopProgress).toBeCalledTimes(1);
      expect(mockOpenNonstopProgress).toHaveBeenLastCalledWith({
        id: 'photo-edit-processing',
        message: 'Processing',
      });
      expect(mockPreprocessByUrl).toBeCalledTimes(1);
      expect(mockPreprocessByUrl).toHaveBeenLastCalledWith('mock-src');
      expect(mockCalculateBase64).toBeCalledTimes(1);
      expect(mockCalculateBase64).toHaveBeenLastCalledWith('mock-url-1', true, 125, false);
      expect(mockPopById).toBeCalledTimes(1);
      expect(mockPopById).toHaveBeenLastCalledWith('photo-edit-processing');
    });
    await waitFor(() =>
      expect(baseElement.querySelector('.ant-modal')).not.toHaveClass('ant-zoom-appear')
    );
    expect(baseElement).toMatchSnapshot();
  });

  test('cropper apply and complete', async () => {
    mockPreprocessByUrl.mockResolvedValue({
      blobUrl: 'mock-url-1',
      dimension: { x: 0, y: 0, width: 100, height: 100 },
      originalWidth: 200,
      originalHeight: 200,
    });
    mockCalculateBase64
      .mockResolvedValueOnce('mock-base64-1')
      .mockResolvedValueOnce('mock-base64-2');
    const { baseElement, getByText, unmount } = render(
      <CropPanel
        src="mock-src"
        image={mockImage as unknown as SVGImageElement}
        onClose={mockOnClose}
      />
    );
    await waitFor(() => {
      expect(mockPopById).toBeCalledTimes(1);
      expect(mockPopById).toHaveBeenLastCalledWith('photo-edit-processing');
    });
    await new Promise((r) => setTimeout(r));
    const mockCropperInstance = {
      destroy: jest.fn(),
      getData: jest.fn(),
    };
    mockCropper.mockImplementation(() => mockCropperInstance);
    // apply
    const img = baseElement.querySelector('img');
    fireEvent.load(img);
    expect(mockCropper).toBeCalledTimes(1);
    expect(mockCropper).toHaveBeenLastCalledWith(img, {
      aspectRatio: NaN,
      autoCropArea: 1,
      zoomable: false,
      viewMode: 2,
      minCropBoxWidth: 1,
      minCropBoxHeight: 1,
    });
    expect(mockCropperInstance.destroy).not.toBeCalled();
    const mockImageNatureWidth = jest.spyOn(img, 'naturalWidth', 'get');
    mockImageNatureWidth.mockReturnValue(100);
    const mockImageNatureHeight = jest.spyOn(img, 'naturalHeight', 'get');
    mockImageNatureHeight.mockReturnValue(100);
    mockCropperInstance.getData.mockReturnValueOnce({ x: 10, y: 10, width: 80, height: 80 });
    mockCropImage.mockResolvedValueOnce('mock-url-2');
    await act(async () => {
      fireEvent.click(getByText('Apply'));
      await new Promise((r) => setTimeout(r));
    });
    expect(mockCropperInstance.getData).toBeCalledTimes(1);
    expect(mockOpenNonstopProgress).toBeCalledTimes(2);
    expect(mockCropImage).toBeCalledTimes(1);
    expect(mockCropImage).toHaveBeenLastCalledWith('mock-url-1', 10, 10, 80, 80);
    expect(mockCalculateBase64).toBeCalledTimes(2);
    expect(mockCalculateBase64).toHaveBeenLastCalledWith('mock-url-2', true, 125, false);
    expect(mockPopById).toBeCalledTimes(2);

    // complete
    fireEvent.load(img);
    expect(mockCropperInstance.destroy).toBeCalledTimes(1);
    expect(mockCropper).toBeCalledTimes(2);
    expect(mockCropper).toHaveBeenLastCalledWith(img, {
      aspectRatio: NaN,
      autoCropArea: 1,
      zoomable: false,
      viewMode: 2,
      minCropBoxWidth: 1,
      minCropBoxHeight: 1,
    });
    await waitFor(() =>
      expect(baseElement.querySelector('.ant-modal')).not.toHaveClass('ant-zoom-appear')
    );
    expect(baseElement).toMatchSnapshot();

    mockImageNatureWidth.mockReturnValue(80);
    mockImageNatureHeight.mockReturnValue(80);
    mockCropperInstance.getData.mockReturnValueOnce({ x: 10, y: 10, width: 60, height: 60 });
    mockCropImage.mockResolvedValueOnce('mock-url-3');
    mockCalculateBase64.mockResolvedValueOnce('mock-base64-3');
    await act(async () => {
      fireEvent.click(getByText('OK'));
      await new Promise((r) => setTimeout(r));
    });
    expect(mockCropperInstance.getData).toBeCalledTimes(2);
    expect(mockOpenNonstopProgress).toBeCalledTimes(3);
    expect(mockCropImage).toBeCalledTimes(2);
    expect(mockCropImage).toHaveBeenLastCalledWith('mock-src', 40, 40, 120, 120);
    expect(mockCalculateBase64).toBeCalledTimes(3);
    expect(mockCalculateBase64).toHaveBeenLastCalledWith('mock-url-3', true, 125, false);
    expect(mockHandleFinish).toBeCalledTimes(1);
    expect(mockHandleFinish).toHaveBeenLastCalledWith(mockImage, 'mock-url-3', 'mock-base64-3', {
      x: 140,
      y: 140,
      width: 120,
      height: 120,
    });
    expect(mockPopById).toBeCalledTimes(3);
    expect(mockOnClose).toBeCalledTimes(1);
    await act(async () => unmount());
    expect(mockRevokeObjectURL).toBeCalledTimes(2);
    expect(mockRevokeObjectURL).toHaveBeenNthCalledWith(1, 'mock-url-1');
    expect(mockRevokeObjectURL).toHaveBeenNthCalledWith(2, 'mock-url-2');
  });

  test('apply and go back', async () => {
    mockPreprocessByUrl.mockResolvedValue({
      blobUrl: 'mock-url-1',
      dimension: { x: 0, y: 0, width: 100, height: 100 },
      originalWidth: 200,
      originalHeight: 200,
    });
    mockCalculateBase64
      .mockResolvedValueOnce('mock-base64-1')
      .mockResolvedValueOnce('mock-base64-2');
    const { baseElement, getByText, unmount } = render(
      <CropPanel
        src="mock-src"
        image={mockImage as unknown as SVGImageElement}
        onClose={mockOnClose}
      />
    );
    await waitFor(() => {
      expect(mockPopById).toBeCalledTimes(1);
      expect(mockPopById).toHaveBeenLastCalledWith('photo-edit-processing');
    });
    await new Promise((r) => setTimeout(r));
    const mockCropperInstance = {
      destroy: jest.fn(),
      getData: jest.fn(),
    };
    mockCropper.mockImplementation(() => mockCropperInstance);
    // apply
    const img = baseElement.querySelector('img');
    fireEvent.load(img);
    expect(mockCropper).toBeCalledTimes(1);
    expect(mockCropper).toHaveBeenLastCalledWith(img, {
      aspectRatio: NaN,
      autoCropArea: 1,
      zoomable: false,
      viewMode: 2,
      minCropBoxWidth: 1,
      minCropBoxHeight: 1,
    });
    expect(mockCropperInstance.destroy).not.toBeCalled();
    const mockImageNatureWidth = jest.spyOn(img, 'naturalWidth', 'get');
    mockImageNatureWidth.mockReturnValue(100);
    const mockImageNatureHeight = jest.spyOn(img, 'naturalHeight', 'get');
    mockImageNatureHeight.mockReturnValue(100);
    mockCropperInstance.getData.mockReturnValueOnce({ x: 10, y: 10, width: 80, height: 80 });
    mockCropImage.mockResolvedValueOnce('mock-url-2');
    await act(async () => {
      fireEvent.click(getByText('Apply'));
      await new Promise((r) => setTimeout(r));
    });
    expect(mockCropperInstance.getData).toBeCalledTimes(1);
    expect(mockOpenNonstopProgress).toBeCalledTimes(2);
    expect(mockCropImage).toBeCalledTimes(1);
    expect(mockCropImage).toHaveBeenLastCalledWith('mock-url-1', 10, 10, 80, 80);
    expect(mockCalculateBase64).toBeCalledTimes(2);
    expect(mockCalculateBase64).toHaveBeenLastCalledWith('mock-url-2', true, 125, false);
    expect(mockPopById).toBeCalledTimes(2);

    mockCalculateBase64.mockResolvedValueOnce('mock-base64-1');
    expect(mockRevokeObjectURL).not.toBeCalled();
    await act(async () => {
      fireEvent.click(getByText('Back'));
      await new Promise((r) => setTimeout(r));
    });
    expect(mockOpenNonstopProgress).toBeCalledTimes(3);
    expect(mockRevokeObjectURL).toBeCalledTimes(1);
    expect(mockRevokeObjectURL).toHaveBeenLastCalledWith('mock-url-2');
    expect(mockPopById).toBeCalledTimes(3);

    expect(mockOnClose).not.toBeCalled();
    fireEvent.click(getByText('Cancel'));
    expect(mockOnClose).toBeCalledTimes(1);
    unmount();
    expect(mockRevokeObjectURL).toBeCalledTimes(2);
    expect(mockRevokeObjectURL).toHaveBeenLastCalledWith('mock-url-1');
  });

  test('change aspect ratio', async () => {
    useIsMobile.mockReturnValue(true);
    mockPreprocessByUrl.mockResolvedValue({
      blobUrl: 'mock-url-1',
      dimension: { x: 0, y: 0, width: 100, height: 150 },
      originalWidth: 200,
      originalHeight: 300,
    });
    mockCalculateBase64
      .mockResolvedValueOnce('mock-base64-1')
      .mockResolvedValueOnce('mock-base64-2');
    const { baseElement, getByText, unmount } = render(
      <CropPanel
        src="mock-src"
        image={mockImage as unknown as SVGImageElement}
        onClose={mockOnClose}
      />
    );
    await waitFor(() => {
      expect(mockPopById).toBeCalledTimes(1);
      expect(mockPopById).toHaveBeenLastCalledWith('photo-edit-processing');
    });
    await new Promise((r) => setTimeout(r));
    const mockCropperInstance = {
      destroy: jest.fn(),
      getData: jest.fn(),
    };
    mockCropper.mockImplementation(() => mockCropperInstance);
    const img = baseElement.querySelector('img');
    fireEvent.load(img);
    expect(mockCropper).toBeCalledTimes(1);
    expect(mockCropper).toHaveBeenLastCalledWith(img, {
      aspectRatio: NaN,
      autoCropArea: 1,
      zoomable: false,
      viewMode: 2,
      minCropBoxWidth: 1,
      minCropBoxHeight: 1,
    });
    expect(mockCropperInstance.destroy).not.toBeCalled();
    const ratioSelect = baseElement.querySelector('.ant-select-selector');
    expect(ratioSelect).toHaveTextContent('Free');
    fireEvent.mouseDown(ratioSelect);
    fireEvent.click(getByText('4:3'));
    expect(ratioSelect).toHaveTextContent('4:3');
    expect(mockCropperInstance.destroy).toBeCalledTimes(1);
    expect(mockCropper).toBeCalledTimes(2);
    expect(mockCropper).toHaveBeenLastCalledWith(img, {
      aspectRatio: 4 / 3,
      autoCropArea: 1,
      zoomable: false,
      viewMode: 2,
      minCropBoxWidth: 1,
      minCropBoxHeight: 1,
    });
    fireEvent.mouseDown(ratioSelect);
    fireEvent.click(getByText('Original'));
    expect(ratioSelect).toHaveTextContent('Original');
    expect(mockCropperInstance.destroy).toBeCalledTimes(2);
    expect(mockCropper).toBeCalledTimes(3);
    expect(mockCropper).toHaveBeenLastCalledWith(img, {
      aspectRatio: 2 / 3,
      autoCropArea: 1,
      zoomable: false,
      viewMode: 2,
      minCropBoxWidth: 1,
      minCropBoxHeight: 1,
    });
    unmount();
  });
});
