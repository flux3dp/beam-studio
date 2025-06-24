import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import moduleOffsets from '@core/app/constants/layer-module/module-offsets';
import type { FisheyeCameraParametersV1 } from '@core/interfaces/FisheyePreview';

const mockFisheyePreviewManagerV2 = jest.fn();

jest.mock('@core/app/actions/camera/preview-helper/FisheyePreviewManagerV2', () => mockFisheyePreviewManagerV2);

const mockFisheyePreviewManagerV4 = jest.fn();

jest.mock('@core/app/actions/camera/preview-helper/FisheyePreviewManagerV4', () => mockFisheyePreviewManagerV4);

import Align from './Align';
import CalibrationType from './calibrationTypes';

const mockPopUpError = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUpError: (...args) => mockPopUpError(...args),
}));

const mockSetFisheyeMatrix = jest.fn();
const mockTakeOnePicture = jest.fn();
const mockConnectCamera = jest.fn();
const mockDisconnectCamera = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  connectCamera: (...args) => mockConnectCamera(...args),
  currentDevice: {
    info: {
      model: 'ado1',
    },
  },
  disconnectCamera: (...args) => mockDisconnectCamera(...args),
  setFisheyeMatrix: (...args) => mockSetFisheyeMatrix(...args),
  takeOnePicture: (...args) => mockTakeOnePicture(...args),
}));

const mockWrite = jest.fn();

const mockBeamboxPreferences = {
  'module-offsets': {
    ado1: {
      [LayerModule.PRINTER]: [0, -13.37],
    },
  },
};

jest.mock('@core/app/actions/beambox/beambox-preference', () => ({
  read: (key) => mockBeamboxPreferences[key],
  write: (...args) => mockWrite(...args),
}));

const mockGetPerspectiveForAlign = jest.fn();

jest.mock(
  './getPerspectiveForAlign',
  () =>
    (...args) =>
      mockGetPerspectiveForAlign(...args),
);

const mockSetFisheyeConfig = jest.fn();

jest.mock('@core/helpers/camera-calibration-helper', () => ({
  setFisheyeConfig: (...args) => mockSetFisheyeConfig(...args),
}));

const mockOpenNonstopProgress = jest.fn();
const mockPopById = jest.fn();

jest.mock('@core/app/actions/progress-caller', () => ({
  openNonstopProgress: (...args) => mockOpenNonstopProgress(...args),
  popById: (...args) => mockPopById(...args),
}));

const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

const mockOnClose = jest.fn();
const mockOnBack = jest.fn();

const mockFishEyeParam: FisheyeCameraParametersV1 = {
  center: [1200, 1000],
  d: [[0]],
  heights: [0],
  k: [[0]],
  points: [[[[0, 0]]]],
  z3regParam: [[[[0, 0]]]],
};

const mockSetupFisheyePreview = jest.fn();

describe('test Align', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    mockConnectCamera.mockResolvedValue(undefined);
    mockSetFisheyeMatrix.mockResolvedValue(undefined);
    mockFisheyePreviewManagerV2.mockImplementation(() => ({
      setupFisheyePreview: mockSetupFisheyePreview,
    }));
  });

  it('should render correctly', async () => {
    mockTakeOnePicture.mockResolvedValue({ imgBlob: 'blob' });
    mockCreateObjectURL.mockReturnValue('file://url');

    const { baseElement, getByText } = render(
      <Align
        fisheyeParam={mockFishEyeParam}
        onBack={mockOnBack}
        onClose={mockOnClose}
        title="title"
        type={CalibrationType.CAMERA}
      />,
    );

    expect(baseElement.querySelector('img').src).toBe('');
    await waitFor(() => {
      expect(baseElement.querySelector('.ant-modal')).not.toHaveClass('ant-zoom-appear');
      expect(baseElement.querySelector('img').src).not.toBe('');
    });
    expect(mockConnectCamera).toHaveBeenCalledTimes(1);
    expect(mockGetPerspectiveForAlign).toHaveBeenCalledTimes(1);
    expect(mockSetFisheyeMatrix).toHaveBeenCalledTimes(1);
    expect(mockTakeOnePicture).toHaveBeenCalledTimes(1);
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    expect(mockCreateObjectURL).toHaveBeenLastCalledWith('blob');
    expect(baseElement).toMatchSnapshot();
    fireEvent.click(getByText('Show Last Result'));
    expect(baseElement.querySelector('.last')).toBeInTheDocument();
  });

  test('onBack, onClose', async () => {
    mockTakeOnePicture.mockResolvedValue({ imgBlob: 'blob' });
    mockCreateObjectURL.mockReturnValue('file://url');

    const { baseElement, getByText } = render(
      <Align
        fisheyeParam={mockFishEyeParam}
        onBack={mockOnBack}
        onClose={mockOnClose}
        title="title"
        type={CalibrationType.CAMERA}
      />,
    );

    expect(baseElement.querySelector('img').src).toBe('');
    await waitFor(() => {
      expect(baseElement.querySelector('img').src).not.toBe('');
    });

    expect(mockOnBack).toHaveBeenCalledTimes(0);
    fireEvent.click(getByText('Back'));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  test('scroll and next should work when type is Camera', async () => {
    mockTakeOnePicture.mockResolvedValue({ imgBlob: 'blob' });
    mockCreateObjectURL.mockReturnValue('file://url');

    const { baseElement, getByText } = render(
      <Align
        fisheyeParam={mockFishEyeParam}
        onBack={mockOnBack}
        onClose={mockOnClose}
        title="title"
        type={CalibrationType.CAMERA}
      />,
    );

    expect(baseElement.querySelector('img').src).toBe('');
    await waitFor(() => {
      expect(baseElement.querySelector('.ant-modal')).not.toHaveClass('ant-zoom-appear');
      expect(baseElement.querySelector('img').src).not.toBe('');
    });
    expect(mockOpenNonstopProgress).toHaveBeenCalledTimes(2);
    expect(mockOpenNonstopProgress).toHaveBeenLastCalledWith({
      id: 'calibration-align',
      message: 'Taking Picture...',
    });
    expect(mockPopById).toHaveBeenCalledTimes(2);
    expect(mockPopById).toHaveBeenLastCalledWith('calibration-align');

    const img = baseElement.querySelector('img');

    fireEvent.load(img);
    expect(baseElement).toMatchSnapshot();

    const xInput = baseElement.querySelector('.ant-input-number-input#x');
    const yInput = baseElement.querySelector('.ant-input-number-input#y');
    const imgContainer = baseElement.querySelector('.img-container');

    expect(imgContainer.scrollLeft).toBe(1200);
    expect(imgContainer.scrollTop).toBe(1000);
    fireEvent.change(xInput, { target: { value: 100 } });
    expect(imgContainer.scrollLeft).toBe(100);
    fireEvent.change(yInput, { target: { value: 200 } });
    expect(imgContainer.scrollTop).toBe(200);
    fireEvent.click(getByText('Use Last Calibration Value'));
    expect(imgContainer.scrollLeft).toBe(1200);
    expect(imgContainer.scrollTop).toBe(1000);
    fireEvent.scroll(imgContainer, { target: { scrollLeft: 500, scrollTop: 600 } });
    expect(xInput).toHaveValue(500);
    expect(yInput).toHaveValue(600);
    fireEvent.click(getByText('Done'));
    expect(mockSetFisheyeConfig).toHaveBeenCalledTimes(1);
    expect(mockSetFisheyeConfig).toHaveBeenLastCalledWith({
      ...mockFishEyeParam,
      center: [500, 600],
    });
  });

  test('scroll and next should work when type is MODULE and module is PRINTER', async () => {
    mockTakeOnePicture.mockResolvedValue({ imgBlob: 'blob' });
    mockCreateObjectURL.mockReturnValue('file://url');

    const { baseElement, getByText } = render(
      <Align
        fisheyeParam={mockFishEyeParam}
        module={LayerModule.PRINTER}
        onBack={mockOnBack}
        onClose={mockOnClose}
        title="title"
        type={CalibrationType.MODULE}
      />,
    );

    expect(baseElement.querySelector('img').src).toBe('');
    await waitFor(() => {
      expect(baseElement.querySelector('.ant-modal')).not.toHaveClass('ant-zoom-appear');
      expect(baseElement.querySelector('img').src).not.toBe('');
    });
    expect(mockOpenNonstopProgress).toHaveBeenCalledTimes(2);
    expect(mockOpenNonstopProgress).toHaveBeenLastCalledWith({
      id: 'calibration-align',
      message: 'Taking Picture...',
    });
    expect(mockPopById).toHaveBeenCalledTimes(2);
    expect(mockPopById).toHaveBeenLastCalledWith('calibration-align');

    const img = baseElement.querySelector('img');

    fireEvent.load(img);
    expect(baseElement).toMatchSnapshot();

    const xInput = baseElement.querySelector('.ant-input-number-input#x');
    const yInput = baseElement.querySelector('.ant-input-number-input#y');
    const imgContainer = baseElement.querySelector('.img-container');

    expect(imgContainer.scrollLeft).toBe(1200);
    expect(imgContainer.scrollTop).toBe(1000);
    fireEvent.change(xInput, { target: { value: 10 } });
    expect(imgContainer.scrollLeft).toBe(1250);
    fireEvent.change(yInput, { target: { value: 10 } });
    expect(imgContainer.scrollTop).toBe(1050);
    fireEvent.click(getByText('Use Last Calibration Value'));
    expect(imgContainer.scrollLeft).toBe(1200);
    expect(imgContainer.scrollTop).toBe(1000);
    fireEvent.scroll(imgContainer, { target: { scrollLeft: 1100, scrollTop: 1100 } });
    expect(xInput).toHaveValue(-20);
    expect(yInput).toHaveValue(20);
    fireEvent.click(getByText('Done'));
    expect(mockWrite).toHaveBeenCalledTimes(1);
    expect(mockWrite).toHaveBeenLastCalledWith('module-offsets', {
      ado1: {
        [LayerModule.PRINTER]: [
          moduleOffsets.ado1[LayerModule.PRINTER][0] - 20,
          moduleOffsets.ado1[LayerModule.PRINTER][1] + 20,
        ],
      },
    });
  });
});
