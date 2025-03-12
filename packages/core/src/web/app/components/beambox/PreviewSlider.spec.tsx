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

jest.mock('@core/helpers/device-master', () => ({
  get currentDevice() {
    return mockGetCurrentDevice();
  },
  getDeviceSetting: (...args: any) => mockGetDeviceSetting(...args),
  setDeviceSetting: (...args: any) => mockSetDeviceSetting(...args),
}));

const mockPreviewFullWorkarea = jest.fn();

jest.mock('@core/app/actions/beambox/preview-mode-controller', () => ({
  isPreviewModeOn: true,
  previewFullWorkarea: () => mockPreviewFullWorkarea(),
}));

jest.mock('@core/app/contexts/CanvasContext', () => ({
  CanvasContext: React.createContext({ mode: CanvasMode.Draw }),
}));

jest.mock('antd', () => ({
  Slider: ({ className, max, min, onAfterChange, onChange, step, value }: any) => (
    <div className={className}>
      Mock Antd Slider
      <p>min: {min}</p>
      <p>max: {max}</p>
      <p>step: {step}</p>
      <p>value: {value}</p>
      <button onClick={() => onChange(0.25)} type="button">
        onChange
      </button>
      <button onClick={() => onAfterChange(20)} type="button">
        onAfterChange
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
    document.body.innerHTML = '<image id="background_image" style="pointer-events:none; opacity: 1;"/>';
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
      </CanvasContext.Provider>,
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
      </CanvasContext.Provider>,
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
      </CanvasContext.Provider>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
