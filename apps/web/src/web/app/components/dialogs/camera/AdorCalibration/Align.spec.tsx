/* eslint-disable import/first */
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';

import { FisheyeCameraParametersV1 } from 'interfaces/FisheyePreview';

import LayerModule from 'app/constants/layer-module/layer-modules';
import moduleOffsets from 'app/constants/layer-module/module-offsets';

const mockFisheyePreviewManagerV2 = jest.fn();
jest.mock('app/actions/camera/preview-helper/FisheyePreviewManagerV2', () => mockFisheyePreviewManagerV2);

import Align from './Align';
import CalibrationType from './calibrationTypes';

const mockPopUpError = jest.fn();
jest.mock('app/actions/alert-caller', () => ({
  popUpError: (...args) => mockPopUpError(...args),
}));

const mockSetFisheyeMatrix = jest.fn();
const mockTakeOnePicture = jest.fn();
const mockConnectCamera = jest.fn();
const mockDisconnectCamera = jest.fn();
jest.mock('helpers/device-master', () => ({
  setFisheyeMatrix: (...args) => mockSetFisheyeMatrix(...args),
  takeOnePicture: (...args) => mockTakeOnePicture(...args),
  connectCamera: (...args) => mockConnectCamera(...args),
  disconnectCamera: (...args) => mockDisconnectCamera(...args),
  currentDevice: {
    info: {
      model: 'ado1',
    },
  },
}));

const mockRead = jest.fn();
const mockWrite = jest.fn();
jest.mock('app/actions/beambox/beambox-preference', () => ({
  read: (...args) => mockRead(...args),
  write: (...args) => mockWrite(...args),
}));

const mockGetPerspectiveForAlign = jest.fn();
jest.mock(
  './getPerspectiveForAlign',
  () =>
    (...args) =>
      mockGetPerspectiveForAlign(...args)
);

const mockSetFisheyeConfig = jest.fn();
jest.mock('helpers/camera-calibration-helper', () => ({
  setFisheyeConfig: (...args) => mockSetFisheyeConfig(...args),
}));

jest.mock('helpers/useI18n', () => () => ({
  buttons: {
    back: 'back',
    done: 'done',
  },
  calibration: {
    taking_picture: 'taking_picture',
    use_last_config: 'use_last_config',
    retake: 'retake',
    show_last_config: 'show_last_config',
  },
}));

const mockOpenNonstopProgress = jest.fn();
const mockPopById = jest.fn();
jest.mock('app/actions/progress-caller', () => ({
  openNonstopProgress: (...args) => mockOpenNonstopProgress(...args),
  popById: (...args) => mockPopById(...args),
}));

const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

const mockOnClose = jest.fn();
const mockOnBack = jest.fn();

const mockFishEyeParam: FisheyeCameraParametersV1 = {
  k: [[0]],
  d: [[0]],
  points: [[[[0, 0]]]],
  heights: [0],
  center: [1200, 1000],
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
        title="title"
        type={CalibrationType.CAMERA}
        onClose={mockOnClose}
        onBack={mockOnBack}
        fisheyeParam={mockFishEyeParam}
      />
    );
    expect(baseElement.querySelector('img').src).toBe('');
    await waitFor(() => {
      expect(baseElement.querySelector('.ant-modal')).not.toHaveClass('ant-zoom-appear');
      expect(baseElement.querySelector('img').src).not.toBe('');
    });
    expect(mockConnectCamera).toBeCalledTimes(1);
    expect(mockGetPerspectiveForAlign).toBeCalledTimes(1);
    expect(mockSetFisheyeMatrix).toBeCalledTimes(1);
    expect(mockTakeOnePicture).toBeCalledTimes(1);
    expect(mockCreateObjectURL).toBeCalledTimes(1);
    expect(mockCreateObjectURL).toHaveBeenLastCalledWith('blob');
    expect(baseElement).toMatchSnapshot();
    fireEvent.click(getByText('show_last_config'));
    expect(baseElement.querySelector('.last')).toBeInTheDocument();
  });

  test('onBack, onClose', async () => {
    mockTakeOnePicture.mockResolvedValue({ imgBlob: 'blob' });
    mockCreateObjectURL.mockReturnValue('file://url');
    const { baseElement, getByText } = render(
      <Align
        title="title"
        type={CalibrationType.CAMERA}
        onClose={mockOnClose}
        onBack={mockOnBack}
        fisheyeParam={mockFishEyeParam}
      />
    );
    expect(baseElement.querySelector('img').src).toBe('');
    await waitFor(() => {
      expect(baseElement.querySelector('img').src).not.toBe('');
    });

    expect(mockOnBack).toBeCalledTimes(0);
    fireEvent.click(getByText('back'));
    expect(mockOnBack).toBeCalledTimes(1);
  });

  test('scroll and next should work when type is Camera', async () => {
    mockTakeOnePicture.mockResolvedValue({ imgBlob: 'blob' });
    mockCreateObjectURL.mockReturnValue('file://url');
    const { baseElement, getByText } = render(
      <Align
        title="title"
        type={CalibrationType.CAMERA}
        onClose={mockOnClose}
        onBack={mockOnBack}
        fisheyeParam={mockFishEyeParam}
      />
    );
    expect(baseElement.querySelector('img').src).toBe('');
    await waitFor(() => {
      expect(baseElement.querySelector('.ant-modal')).not.toHaveClass('ant-zoom-appear');
      expect(baseElement.querySelector('img').src).not.toBe('');
    });
    expect(mockOpenNonstopProgress).toBeCalledTimes(2);
    expect(mockOpenNonstopProgress).toHaveBeenLastCalledWith({
      id: 'calibration-align',
      message: 'taking_picture',
    });
    expect(mockPopById).toBeCalledTimes(2);
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
    fireEvent.click(getByText('use_last_config'));
    expect(imgContainer.scrollLeft).toBe(1200);
    expect(imgContainer.scrollTop).toBe(1000);
    fireEvent.scroll(imgContainer, { target: { scrollLeft: 500, scrollTop: 600 } });
    expect(xInput).toHaveValue(500);
    expect(yInput).toHaveValue(600);
    fireEvent.click(getByText('done'));
    expect(mockSetFisheyeConfig).toBeCalledTimes(1);
    expect(mockSetFisheyeConfig).toHaveBeenLastCalledWith({
      ...mockFishEyeParam,
      center: [500, 600],
    });
  });

  test('scroll and next should work when type is PRINTER_HEAD', async () => {
    mockRead.mockReturnValue(null);
    mockTakeOnePicture.mockResolvedValue({ imgBlob: 'blob' });
    mockCreateObjectURL.mockReturnValue('file://url');
    const { baseElement, getByText } = render(
      <Align
        title="title"
        type={CalibrationType.PRINTER_HEAD}
        onClose={mockOnClose}
        onBack={mockOnBack}
        fisheyeParam={mockFishEyeParam}
      />
    );
    expect(baseElement.querySelector('img').src).toBe('');
    await waitFor(() => {
      expect(baseElement.querySelector('.ant-modal')).not.toHaveClass('ant-zoom-appear')
      expect(baseElement.querySelector('img').src).not.toBe('');
    });
    expect(mockOpenNonstopProgress).toBeCalledTimes(2);
    expect(mockOpenNonstopProgress).toHaveBeenLastCalledWith({
      id: 'calibration-align',
      message: 'taking_picture',
    });
    expect(mockPopById).toBeCalledTimes(2);
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
    fireEvent.click(getByText('use_last_config'));
    expect(imgContainer.scrollLeft).toBe(1200);
    expect(imgContainer.scrollTop).toBe(1000);
    fireEvent.scroll(imgContainer, { target: { scrollLeft: 1100, scrollTop: 1100 } });
    expect(xInput).toHaveValue(-20);
    expect(yInput).toHaveValue(20);
    fireEvent.click(getByText('done'));
    expect(mockWrite).toBeCalledTimes(1);
    expect(mockWrite).toHaveBeenLastCalledWith('module-offsets', {
      [LayerModule.PRINTER]: [moduleOffsets[LayerModule.PRINTER][0] - 20, moduleOffsets[LayerModule.PRINTER][1] + 20],
    });
  });
});
