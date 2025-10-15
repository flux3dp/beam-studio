import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import { CanvasMode } from '@core/app/constants/canvasMode';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';

import PreviewSlider from './PreviewSlider';

const mockGetCurrentDevice = jest.fn();
const mockGetCurrentControlMode = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  get currentControlMode() {
    return mockGetCurrentControlMode();
  },
  get currentDevice() {
    return mockGetCurrentDevice();
  },
}));

const mockGetExposureSettings = jest.fn();
const mockSetExposure = jest.fn();

jest.mock('@core/helpers/device/camera/cameraExposure', () => ({
  getExposureSettings: () => mockGetExposureSettings(),
  setExposure: (value: number) => mockSetExposure(value),
}));

const mockUseCameraPreviewStore = jest.fn();

jest.mock('@core/app/stores/cameraPreview', () => ({
  useCameraPreviewStore: () => mockUseCameraPreviewStore(),
}));

const mockPreviewFullWorkarea = jest.fn();
const mockIsFullScreen = jest.fn();

jest.mock('@core/app/actions/beambox/preview-mode-controller', () => ({
  get isFullScreen() {
    return mockIsFullScreen();
  },
  previewFullWorkarea: () => mockPreviewFullWorkarea(),
}));

const mockMeetRequirement = jest.fn();

jest.mock('@core/helpers/version-checker', () => () => ({
  meetRequirement: (...args) => mockMeetRequirement(...args),
}));

jest.mock('antd', () => ({
  ConfigProvider: ({ children }: any) => children,
  Slider: ({ className, disabled, max, min, onChange, onChangeComplete, step, value }: any) => (
    <div className={className}>
      Mock Antd Slider
      <p>min: {min}</p>
      <p>max: {max}</p>
      <p>step: {step}</p>
      <p>value: {value}</p>
      <button disabled={disabled} onClick={() => onChange(0.25)} type="button">
        onChange
      </button>
      <button disabled={disabled} onClick={() => onChangeComplete(20)} type="button">
        onChangeComplete
      </button>
    </div>
  ),
  Space: ({ children, className, direction }: any) => (
    <div className={className}>
      Mock Antd Space
      <p>direction: {direction}</p>
      {children}
    </div>
  ),
  Tooltip: ({ children, title }: any) => (
    <div>
      Mock Antd Tooltip
      <p>title: {title}</p>
      {children}
    </div>
  ),
}));

describe('test PreviewSlider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFullScreen.mockReturnValue(true);
    mockMeetRequirement.mockReturnValue(true);
    document.body.innerHTML =
      '<svg id="previewSvg"><image id="backgroundImage" style="pointer-events:none; opacity: 1;"/></svg>';
    mockUseCameraPreviewStore.mockReturnValue({
      isPreviewMode: true,
    });
    mockGetExposureSettings.mockReturnValue({
      max: 10000,
      min: 50,
      step: 1,
      value: 450,
    });
    useCanvasStore.getState().setMode(CanvasMode.Draw);
  });

  it('should render correctly with preview image', async () => {
    const { container, getByText } = render(<PreviewSlider />);
    const imageContainer = document.getElementById('previewSvg');

    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('onChange'));
    expect(imageContainer).toHaveStyle({ opacity: 0.25 });
    expect(container).toMatchSnapshot();
  });

  it('should render correctly without background image', () => {
    document.body.innerHTML = '';

    const { container } = render(<PreviewSlider />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when is previewing', () => {
    const imageContainer = document.getElementById('previewSvg');

    imageContainer.style.opacity = '0.5';
    mockGetCurrentDevice.mockReturnValue({ info: { model: 'model-1' } });
    useCanvasStore.getState().setMode(CanvasMode.Preview);

    const { container } = render(<PreviewSlider />);

    expect(imageContainer).toHaveStyle({ opacity: 1 });
    expect(container).toMatchSnapshot();
    expect(mockGetExposureSettings).not.toHaveBeenCalled();
  });

  it('should render correctly when is previewing Ador', async () => {
    const imageContainer = document.getElementById('previewSvg');

    imageContainer.style.opacity = '0.5';
    mockGetCurrentDevice.mockReturnValue({ info: { model: 'ado1' } });
    useCanvasStore.getState().setMode(CanvasMode.Preview);

    const { container, getByText } = render(<PreviewSlider />);

    expect(imageContainer).toHaveStyle({ opacity: 1 });
    await waitFor(() => {
      expect(mockGetExposureSettings).toHaveBeenCalledTimes(1);
    });
    expect(mockMeetRequirement).not.toHaveBeenCalled();
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('onChange'));
    expect(mockSetExposure).not.toHaveBeenCalled();
    expect(mockPreviewFullWorkarea).not.toHaveBeenCalled();
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('onChangeComplete'));
    await waitFor(() => {
      expect(mockSetExposure).toHaveBeenCalledTimes(1);
      expect(mockSetExposure).toHaveBeenNthCalledWith(1, 20);
      expect(mockPreviewFullWorkarea).toHaveBeenCalledTimes(1);
    });
  });

  it('should render correctly when is previewing BB2', async () => {
    mockIsFullScreen.mockReturnValue(false);

    const imageContainer = document.getElementById('previewSvg');

    imageContainer.style.opacity = '0.5';
    mockGetCurrentDevice.mockReturnValue({ info: { model: 'fbb2' } });
    useCanvasStore.getState().setMode(CanvasMode.Preview);

    const { container, getByText } = render(<PreviewSlider />);

    expect(imageContainer).toHaveStyle({ opacity: 1 });
    await waitFor(() => {
      expect(mockGetExposureSettings).toHaveBeenCalledTimes(1);
    });
    expect(mockMeetRequirement).toHaveBeenNthCalledWith(1, 'BB2_SEPARATE_EXPOSURE');
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('onChange'));
    expect(mockSetExposure).not.toHaveBeenCalled();
    expect(mockPreviewFullWorkarea).not.toHaveBeenCalled();
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('onChangeComplete'));
    await waitFor(() => {
      expect(mockSetExposure).toHaveBeenNthCalledWith(1, 20);
      expect(mockPreviewFullWorkarea).not.toHaveBeenCalled();
    });
  });

  it('should render correctly when is path previewing', () => {
    useCanvasStore.getState().setMode(CanvasMode.PathPreview);

    const { container } = render(<PreviewSlider />);

    expect(container).toBeEmptyDOMElement();
  });

  it('should be disabled when in raw mode and drawing', async () => {
    mockGetCurrentControlMode.mockReturnValue('raw');
    mockUseCameraPreviewStore.mockReturnValue({ isDrawing: true, isPreviewMode: true });
    mockGetCurrentDevice.mockReturnValue({ info: { model: 'fbm2' } });
    useCanvasStore.getState().setMode(CanvasMode.Preview);

    const { container, getByText } = render(<PreviewSlider />);

    await waitFor(() => {
      expect(mockGetExposureSettings).toHaveBeenCalledTimes(1);
    });

    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('onChangeComplete'));
    await waitFor(() => {
      expect(mockSetExposure).not.toHaveBeenCalled();
    });
  });
});
