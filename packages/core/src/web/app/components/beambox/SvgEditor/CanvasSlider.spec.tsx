import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import { TimeEstimationButtonContext } from '@core/app/contexts/TimeEstimationButtonContext';
import { CanvasMode } from '@core/app/constants/canvasMode';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';

import CanvasSlider from './CanvasSlider';

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
const mockIsFullArea = jest.fn();

jest.mock('@core/app/actions/beambox/preview-mode-controller', () => ({
  get isFullArea() {
    return mockIsFullArea();
  },
  previewFullWorkarea: () => mockPreviewFullWorkarea(),
}));

const mockMeetRequirement = jest.fn();

jest.mock('@core/helpers/version-checker', () => () => ({
  meetRequirement: (...args) => mockMeetRequirement(...args),
}));

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: () => ({
    on: jest.fn(),
    removeListener: jest.fn(),
  }),
}));

jest.mock('@core/app/svgedit/workarea', () => ({
  zoomRatio: 1,
}));

jest.mock('@core/helpers/useI18n', () => () => ({
  beambox: {
    time_est_button: { calculate: 'Calculate' },
    zoom_block: { canvas_zoom: 'Canvas Adjustment' },
  },
  editor: {
    exposure: 'Brightness',
    opacity: 'Preview Opacity',
  },
  zoom_block: {
    canvas_zoom: 'Canvas Adjustment',
    estimate_time: 'Calculate Time',
    exposure: 'Exposure',
    opacity: 'Opacity',
  },
}));

jest.mock('@core/helpers/getOS', () => ({
  getOS: () => 'others',
}));

jest.mock('@core/implementations/os', () => ({
  process: { exec: jest.fn() },
}));

jest.mock('@core/helpers/web-need-connection-helper', () => (fn: () => void) => fn());

jest.mock('@core/app/actions/beambox/export-funcs', () => ({
  estimateTime: jest.fn().mockResolvedValue(null),
}));

jest.mock('@core/helpers/duration-formatter', () => (seconds: number) => `${seconds}s`);

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
  Switch: ({ className, disabled, loading, onChange, value }: any) => (
    <div className={className}>
      Mock Antd Switch
      <p>value: {String(value)}</p>
      <button disabled={disabled || loading} onClick={() => onChange(!value)} type="button">
        toggleSwitch
      </button>
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

const renderWithContext = (ui: React.ReactElement, estimatedTime: null | number = null) =>
  render(
    <TimeEstimationButtonContext value={{ estimatedTime, setEstimatedTime: jest.fn() }}>
      {ui}
    </TimeEstimationButtonContext>,
  );

describe('test CanvasSlider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFullArea.mockReturnValue(true);
    mockMeetRequirement.mockReturnValue(true);
    document.body.innerHTML =
      '<svg id="previewSvg"><image id="backgroundImage" style="pointer-events:none; opacity: 1;"/></svg>';
    mockUseCameraPreviewStore.mockReturnValue({ isPreviewMode: false });
    mockGetExposureSettings.mockReturnValue({
      max: 10000,
      min: 50,
      step: 1,
      value: 450,
    });
    useCanvasStore.getState().setMode(CanvasMode.Draw);
  });

  it('should render correctly with preview image', async () => {
    const { container, getByText } = renderWithContext(<CanvasSlider />);
    const imageContainer = document.getElementById('previewSvg');

    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('onChange'));
    expect(imageContainer).toHaveStyle({ opacity: 0.25 });
    expect(container).toMatchSnapshot();
  });

  it('should render correctly without background image', () => {
    document.body.innerHTML = '';

    const { container } = renderWithContext(<CanvasSlider />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when is previewing', () => {
    const imageContainer = document.getElementById('previewSvg');

    imageContainer.style.opacity = '0.5';
    mockGetCurrentDevice.mockReturnValue({ info: { model: 'model-1' } });
    mockUseCameraPreviewStore.mockReturnValue({ isPreviewMode: true });

    const { container } = renderWithContext(<CanvasSlider />);

    expect(imageContainer).toHaveStyle({ opacity: 1 });
    expect(container).toMatchSnapshot();
    expect(mockGetExposureSettings).not.toHaveBeenCalled();
  });

  it('should render correctly when is previewing Ador', async () => {
    const imageContainer = document.getElementById('previewSvg');

    imageContainer.style.opacity = '0.5';
    mockGetCurrentDevice.mockReturnValue({ info: { model: 'ado1' } });
    mockUseCameraPreviewStore.mockReturnValue({ isPreviewMode: true });

    const { container, getByText } = renderWithContext(<CanvasSlider />);

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
    mockIsFullArea.mockReturnValue(false);

    const imageContainer = document.getElementById('previewSvg');

    imageContainer.style.opacity = '0.5';
    mockGetCurrentDevice.mockReturnValue({ info: { model: 'fbb2' } });
    mockUseCameraPreviewStore.mockReturnValue({ isPreviewMode: true });

    const { container, getByText } = renderWithContext(<CanvasSlider />);

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

  it('should be disabled when in raw mode and drawing', async () => {
    mockGetCurrentControlMode.mockReturnValue('raw');
    mockUseCameraPreviewStore.mockReturnValue({ isDrawing: true, isPreviewMode: true });
    mockGetCurrentDevice.mockReturnValue({ info: { model: 'fbm2' } });

    const { container, getByText } = renderWithContext(<CanvasSlider />);

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
