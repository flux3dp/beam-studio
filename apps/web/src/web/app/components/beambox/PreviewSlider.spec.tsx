/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';

import { CanvasContext } from 'app/contexts/CanvasContext';
import { CanvasMode } from 'app/constants/canvasMode';

import PreviewSlider from './PreviewSlider';

jest.mock('helpers/useI18n', () => () => ({
  editor: {
    opacity: 'Preview Opacity',
    exposure: 'Preview Exposure',
  },
}));

const mockSetDeviceSetting = jest.fn();
const mockGetDeviceSetting = jest.fn().mockResolvedValue({
  key: 'camera_exposure_absolute',
  value: '{"data_type": "int", "min": 50, "default": 166, "max": 10000, "value": 450, "step": 1}',
  cmd: 'config get camera_exposure_absolute',
  status: 'ok',
});
const mockGetCurrentDevice = jest.fn();
jest.mock('helpers/device-master', () => ({
  setDeviceSetting: (...args: any) => mockSetDeviceSetting(...args),
  getDeviceSetting: (...args: any) => mockGetDeviceSetting(...args),
  get currentDevice() {
    return mockGetCurrentDevice();
  },
}));

const mockPreviewFullWorkarea = jest.fn();
jest.mock('app/actions/beambox/preview-mode-controller', () => ({
  isPreviewModeOn: true,
  previewFullWorkarea: () => mockPreviewFullWorkarea(),
}));

jest.mock('app/contexts/CanvasContext', () => ({
  CanvasContext: React.createContext({ mode: CanvasMode.Draw }),
}));

jest.mock('antd', () => ({
  Tooltip: ({ title, children }: any) => (
    <div>
      Mock Antd Tooltip
      <p>title: {title}</p>
      {children}
    </div>
  ),
  Slider: ({ className, min, max, step, value, onChange, onAfterChange }: any) => (
    <div className={className}>
      Mock Antd Slider
      <p>min: {min}</p>
      <p>max: {max}</p>
      <p>step: {step}</p>
      <p>value: {value}</p>
      <button type="button" onClick={() => onChange(0.25)}>
        onChange
      </button>
      <button type="button" onClick={() => onAfterChange(20)}>
        onAfterChange
      </button>
    </div>
  ),
  Space: ({ className, direction, children }: any) => (
    <div className={className}>
      Mock Antd Space
      <p>direction: {direction}</p>
      {children}
    </div>
  ),
}));

describe('test PreviewSlider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML =
      '<image id="background_image" style="pointer-events:none; opacity: 1;"/>';
  });

  it('should render correctly with preview image', async () => {
    const { container, getByText } = render(<PreviewSlider />);
    const bgImage = document.getElementById('background_image');
    expect(bgImage).toHaveStyle({ opacity: 1 });
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('onChange'));
    expect(bgImage).toHaveStyle({ opacity: 0.25 });
    expect(container).toMatchSnapshot();
  });

  it('should render correctly without background image', () => {
    document.body.innerHTML = '';
    const { container } = render(<PreviewSlider />);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly when is previewing', () => {
    const bgImage: HTMLElement = document.getElementById('background_image');
    bgImage.style.opacity = '0.5';
    mockGetCurrentDevice.mockReturnValue({ info: { model: 'model-1' } });
    const { container } = render(
      <CanvasContext.Provider value={{ mode: CanvasMode.Preview } as any}>
        <PreviewSlider />
      </CanvasContext.Provider>
    );
    expect(bgImage).toHaveStyle({ opacity: 1 });
    expect(container).toMatchSnapshot();
    expect(mockGetDeviceSetting).not.toBeCalled();
  });

  it('should render correctly when is previewing Ador', async () => {
    const bgImage: HTMLElement = document.getElementById('background_image');
    bgImage.style.opacity = '0.5';
    mockGetCurrentDevice.mockReturnValue({ info: { model: 'ado1' } });
    const { container, getByText } = render(
      <CanvasContext.Provider value={{ mode: CanvasMode.Preview } as any}>
        <PreviewSlider />
      </CanvasContext.Provider>
    );
    expect(bgImage).toHaveStyle({ opacity: 1 });
    await waitFor(() => expect(mockGetDeviceSetting).toBeCalledTimes(1));
    expect(mockGetDeviceSetting).toHaveBeenNthCalledWith(1, 'camera_exposure_absolute');
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('onChange'));
    expect(mockSetDeviceSetting).not.toBeCalled();
    expect(mockPreviewFullWorkarea).not.toBeCalled();
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('onAfterChange'));
    await waitFor(() => {
      expect(mockSetDeviceSetting).toBeCalledTimes(1);
      expect(mockSetDeviceSetting).toHaveBeenNthCalledWith(1, 'camera_exposure_absolute', '20');
      expect(mockPreviewFullWorkarea).toBeCalledTimes(1);
    });
  });

  it('should render correctly when is path previewing', () => {
    const { container } = render(
      <CanvasContext.Provider value={{ mode: CanvasMode.PathPreview } as any}>
        <PreviewSlider />
      </CanvasContext.Provider>
    );
    expect(container).toBeEmptyDOMElement();
  });
});
