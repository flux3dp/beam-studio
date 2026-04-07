import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

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
  Switch: ({ className, disabled, loading, onChange, value }: any) => (
    <div className={className}>
      Mock Antd Switch
      <p>value: {String(value)}</p>
      <button disabled={disabled || loading} onClick={() => onChange(!value)} type="button">
        toggleSwitch
      </button>
    </div>
  ),
}));

describe('test PreviewSlider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsFullArea.mockReturnValue(true);
    mockMeetRequirement.mockReturnValue(true);
    mockGetExposureSettings.mockReturnValue({
      max: 10000,
      min: 50,
      step: 1,
      value: 450,
    });
  });

  it('should render null when not in preview mode', () => {
    mockUseCameraPreviewStore.mockReturnValue({ isPreviewMode: false });

    const { container } = render(<PreviewSlider />);

    expect(container).toMatchSnapshot();
  });

  it('should render null when previewing non-fcodeV2 model', () => {
    mockGetCurrentDevice.mockReturnValue({ info: { model: 'model-1' } });
    mockUseCameraPreviewStore.mockReturnValue({ isPreviewMode: true });

    const { container } = render(<PreviewSlider />);

    expect(container).toMatchSnapshot();
    expect(mockGetExposureSettings).not.toHaveBeenCalled();
  });

  it('should render correctly when previewing Ador', async () => {
    mockGetCurrentDevice.mockReturnValue({ info: { model: 'ado1' } });
    mockUseCameraPreviewStore.mockReturnValue({ isPreviewMode: true });

    const { container, findByText, getByText } = render(<PreviewSlider />);

    await waitFor(() => {
      expect(mockGetExposureSettings).toHaveBeenCalledTimes(1);
    });
    expect(mockMeetRequirement).not.toHaveBeenCalled();
    await findByText('onChange');
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

  it('should render correctly when previewing BB2', async () => {
    mockIsFullArea.mockReturnValue(false);
    mockGetCurrentDevice.mockReturnValue({ info: { model: 'fbb2' } });
    mockUseCameraPreviewStore.mockReturnValue({ isPreviewMode: true });

    const { container, findByText, getByText } = render(<PreviewSlider />);

    await waitFor(() => {
      expect(mockGetExposureSettings).toHaveBeenCalledTimes(1);
    });
    expect(mockMeetRequirement).toHaveBeenNthCalledWith(1, 'BB2_SEPARATE_EXPOSURE');
    await findByText('onChange');
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
