import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';

import PreviewSlider from './PreviewSlider';

const mockSetDeviceSetting = jest.fn();
const mockGetDeviceSetting = jest.fn().mockResolvedValue({
  cmd: 'config get camera_exposure_absolute',
  key: 'camera_exposure_absolute',
  status: 'ok',
  value: '{"data_type": "int", "min": 50, "default": 166, "max": 10000, "value": 450, "step": 1}',
});
const mockGetCurrentDevice = jest.fn();
const mockEndSubTask = jest.fn();
const mockGetCurrentControlMode = jest.fn();
const mockGetCameraExposure = jest.fn();
const mockSetCameraExposure = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  get currentControlMode() {
    return mockGetCurrentControlMode();
  },
  get currentDevice() {
    return mockGetCurrentDevice();
  },
  endSubTask: (...args: any) => mockEndSubTask(...args),
  getCameraExposure: (...args: any) => mockGetCameraExposure(...args),
  getDeviceSetting: (...args: any) => mockGetDeviceSetting(...args),
  setCameraExposure: (...args: any) => mockSetCameraExposure(...args),
  setDeviceSetting: (...args: any) => mockSetDeviceSetting(...args),
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

jest.mock('@core/app/contexts/CanvasContext', () => ({
  CanvasContext: React.createContext({ mode: CanvasMode.Draw }),
}));

const mockMeetRequirement = jest.fn();

jest.mock('@core/helpers/version-checker', () => () => ({
  meetRequirement: (...args) => mockMeetRequirement(...args),
}));

jest.mock('antd', () => ({
  Slider: ({ className, max, min, onChange, onChangeComplete, step, value }: any) => (
    <div className={className}>
      Mock Antd Slider
      <p>min: {min}</p>
      <p>max: {max}</p>
      <p>step: {step}</p>
      <p>value: {value}</p>
      <button onClick={() => onChange(0.25)} type="button">
        onChange
      </button>
      <button onClick={() => onChangeComplete(20)} type="button">
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
    mockGetCurrentControlMode.mockReturnValue('');
    mockIsFullScreen.mockReturnValue(true);
    mockMeetRequirement.mockReturnValue(true);
    document.body.innerHTML =
      '<svg id="previewSvg"><image id="backgroundImage" style="pointer-events:none; opacity: 1;"/></svg>';
    mockUseCameraPreviewStore.mockReturnValue({
      isPreviewMode: true,
    });
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

    const { container } = render(
      <CanvasContext.Provider value={{ mode: CanvasMode.Preview } as any}>
        <PreviewSlider />
      </CanvasContext.Provider>,
    );

    expect(imageContainer).toHaveStyle({ opacity: 1 });
    expect(container).toMatchSnapshot();
    expect(mockGetDeviceSetting).not.toHaveBeenCalled();
  });

  it('should render correctly when is previewing Ador', async () => {
    const imageContainer = document.getElementById('previewSvg');

    imageContainer.style.opacity = '0.5';
    mockGetCurrentDevice.mockReturnValue({ info: { model: 'ado1' } });

    const { container, getByText } = render(
      <CanvasContext.Provider value={{ mode: CanvasMode.Preview } as any}>
        <PreviewSlider />
      </CanvasContext.Provider>,
    );

    expect(imageContainer).toHaveStyle({ opacity: 1 });
    await waitFor(() => {
      expect(mockGetCurrentControlMode).toHaveBeenCalledTimes(1);
      expect(mockEndSubTask).not.toHaveBeenCalled();
      expect(mockGetDeviceSetting).toHaveBeenCalledTimes(1);
    });
    expect(mockGetDeviceSetting).toHaveBeenNthCalledWith(1, 'camera_exposure_absolute');
    expect(mockMeetRequirement).not.toHaveBeenCalled();
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('onChange'));
    expect(mockSetDeviceSetting).not.toHaveBeenCalled();
    expect(mockPreviewFullWorkarea).not.toHaveBeenCalled();
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('onChangeComplete'));
    await waitFor(() => {
      expect(mockGetCurrentControlMode).toHaveBeenCalledTimes(2);
      expect(mockEndSubTask).not.toHaveBeenCalled();
      expect(mockSetDeviceSetting).toHaveBeenCalledTimes(1);
      expect(mockSetDeviceSetting).toHaveBeenNthCalledWith(1, 'camera_exposure_absolute', '20');
      expect(mockPreviewFullWorkarea).toHaveBeenCalledTimes(1);
    });
  });

  it('should render correctly when is previewing BB2', async () => {
    mockGetCurrentControlMode.mockReturnValue('raw');
    mockIsFullScreen.mockReturnValue(false);

    const imageContainer = document.getElementById('previewSvg');

    imageContainer.style.opacity = '0.5';
    mockGetCurrentDevice.mockReturnValue({ info: { model: 'fbb2' } });

    const { container, getByText } = render(
      <CanvasContext.Provider value={{ mode: CanvasMode.Preview } as any}>
        <PreviewSlider />
      </CanvasContext.Provider>,
    );

    expect(imageContainer).toHaveStyle({ opacity: 1 });
    await waitFor(() => {
      expect(mockGetCurrentControlMode).toHaveBeenCalledTimes(1);
      expect(mockEndSubTask).toHaveBeenCalledTimes(1);
      expect(mockGetDeviceSetting).toHaveBeenCalledTimes(1);
    });
    expect(mockGetDeviceSetting).toHaveBeenNthCalledWith(1, 'camera_exposure_absolute');
    expect(mockMeetRequirement).toHaveBeenNthCalledWith(1, 'BB2_SEPARATE_EXPOSURE');
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('onChange'));
    expect(mockSetDeviceSetting).not.toHaveBeenCalled();
    expect(mockPreviewFullWorkarea).not.toHaveBeenCalled();
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('onChangeComplete'));
    await waitFor(() => {
      expect(mockGetCurrentControlMode).toHaveBeenCalledTimes(2);
      expect(mockEndSubTask).toHaveBeenCalledTimes(2);
      expect(mockSetDeviceSetting).toHaveBeenCalledTimes(1);
      expect(mockSetDeviceSetting).toHaveBeenNthCalledWith(1, 'camera_exposure_absolute', '20');
      expect(mockPreviewFullWorkarea).not.toHaveBeenCalled();
    });
  });

  it('should render correctly when is path previewing', () => {
    const { container } = render(
      <CanvasContext.Provider value={{ mode: CanvasMode.PathPreview } as any}>
        <PreviewSlider />
      </CanvasContext.Provider>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should render correctly when is previewing fbm2 with raw mode', async () => {
    mockGetCurrentControlMode.mockReturnValue('raw');
    mockGetCameraExposure.mockResolvedValue({
      data: 500,
      success: true,
    });

    const imageContainer = document.getElementById('previewSvg');

    imageContainer.style.opacity = '0.5';
    mockGetCurrentDevice.mockReturnValue({ info: { model: 'fbm2', version: '1.0.0' } });

    const { container, getByText } = render(
      <CanvasContext.Provider value={{ mode: CanvasMode.Preview } as any}>
        <PreviewSlider />
      </CanvasContext.Provider>,
    );

    expect(imageContainer).toHaveStyle({ opacity: 1 });
    await waitFor(() => {
      expect(mockGetCurrentControlMode).toHaveBeenCalledTimes(1);
      expect(mockGetCameraExposure).toHaveBeenCalledTimes(1);
      expect(mockEndSubTask).not.toHaveBeenCalled();
      expect(mockGetDeviceSetting).not.toHaveBeenCalled();
    });
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('onChange'));
    expect(mockSetCameraExposure).not.toHaveBeenCalled();
    expect(mockPreviewFullWorkarea).not.toHaveBeenCalled();
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('onChangeComplete'));
    await waitFor(() => {
      expect(mockGetCurrentControlMode).toHaveBeenCalledTimes(2);
      expect(mockSetCameraExposure).toHaveBeenCalledTimes(1);
      expect(mockSetCameraExposure).toHaveBeenNthCalledWith(1, 20);
      expect(mockEndSubTask).not.toHaveBeenCalled();
      expect(mockSetDeviceSetting).not.toHaveBeenCalled();
      expect(mockPreviewFullWorkarea).toHaveBeenCalledTimes(1);
    });
  });
});
