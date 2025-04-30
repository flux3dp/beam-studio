import React, { act } from 'react';
import { render } from '@testing-library/react';

import CheckPnP from './CheckPnP';
import type { PerspectiveGrid } from '@core/interfaces/FisheyePreview';

jest.mock('./ImageDisplay', () => ({ img, renderContents }) => (
  <div>
    MockImageDisplay
    <p>img: {img?.url}</p>
    {renderContents?.(1)}
  </div>
));

jest.mock('./ExposureSlider', () => () => <div>MockExposureSlider</div>);

const mockUseCamera = jest.fn();

jest.mock(
  './useCamera',
  () =>
    (...args) =>
      mockUseCamera(...args),
);

const mockCheckPnP = jest.fn();

jest.mock('@core/helpers/api/camera-calibration', () => ({
  cameraCalibrationApi: {
    checkPnP: (...args) => mockCheckPnP(...args),
  },
}));

const mockOnBack = jest.fn();
const mockOnNext = jest.fn();
const mockOnClose = jest.fn();

const mockGrids = {
  x: [0, 10, 1],
  y: [0, 10, 1],
} as PerspectiveGrid;
const mockParams = {
  d: [[0, 0, 0, 0]],
  k: [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ],
  rvec: [0, 0, 0],
  tvec: [0, 0, 0],
};

const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

describe('test CheckPnP', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    mockUseCamera.mockReturnValue({});
  });

  it('should render correctly', async () => {
    const { baseElement } = render(
      <CheckPnP
        cameraOptions={{ index: 1, source: 'wifi' }}
        dh={0}
        grid={mockGrids}
        onBack={mockOnBack}
        onClose={mockOnClose}
        onNext={mockOnNext}
        params={mockParams}
        points={[
          [0, 0],
          [1, 1],
        ]}
      />,
    );

    expect(baseElement).toMatchSnapshot();
    expect(mockUseCamera).toHaveBeenCalledTimes(1);
    expect(mockUseCamera).toHaveBeenCalledWith(expect.any(Function), { index: 1, source: 'wifi' });

    mockCheckPnP.mockResolvedValue({
      blob: 'mock-blob',
      success: true,
    });
    mockCreateObjectURL.mockReturnValue('mock-url');

    const handleImg = mockUseCamera.mock.calls[0][0];

    await act(async () => await handleImg('mock-image-blob'));

    expect(mockCheckPnP).toHaveBeenCalledTimes(1);
    expect(mockCheckPnP).toHaveBeenCalledWith('mock-image-blob', 0, mockParams, mockGrids);
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    expect(mockCreateObjectURL).toHaveBeenCalledWith('mock-blob');
    expect(baseElement).toMatchSnapshot();
  });
});
