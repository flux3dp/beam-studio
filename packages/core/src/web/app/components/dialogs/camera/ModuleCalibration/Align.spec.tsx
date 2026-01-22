import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import { LayerModule } from '@core/app/constants/layer-module/layer-modules';
import type { FisheyeCameraParametersV4 } from '@core/interfaces/FisheyePreview';

const mockFisheyePreviewManagerV2 = jest.fn();

jest.mock('@core/app/actions/camera/preview-helper/FisheyePreviewManagerV2', () => mockFisheyePreviewManagerV2);

const mockFisheyePreviewManagerV4 = jest.fn();

jest.mock('@core/app/actions/camera/preview-helper/FisheyePreviewManagerV4', () => mockFisheyePreviewManagerV4);

const mockDoorChecker = jest.fn();
const mockDoorClosedWrapper = jest.fn();
const mockDestroyDoorChecker = jest.fn();

jest.mock('@core/app/actions/camera/preview-helper/DoorChecker', () => mockDoorChecker);

const mockPopUpError = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUpError: (...args) => mockPopUpError(...args),
}));

const mockSetFisheyeMatrix = jest.fn();
const mockTakeOnePicture = jest.fn();
const mockConnectCamera = jest.fn();
const mockDisconnectCamera = jest.fn();
const mockGetCurrentDevice = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  connectCamera: (...args) => mockConnectCamera(...args),
  get currentDevice() {
    return mockGetCurrentDevice();
  },
  disconnectCamera: (...args) => mockDisconnectCamera(...args),
  setFisheyeMatrix: (...args) => mockSetFisheyeMatrix(...args),
  takeOnePicture: (...args) => mockTakeOnePicture(...args),
}));

const mockGetModuleOffsets = jest.fn().mockResolvedValue([0, 0]);
const mockUpdateModuleOffsets = jest.fn();

jest.mock('@core/helpers/device/moduleOffsets', () => ({
  getModuleOffsets: mockGetModuleOffsets,
  updateModuleOffsets: mockUpdateModuleOffsets,
}));

const mockGetPerspectiveForAlign = jest.fn();

jest.mock(
  './getPerspectiveForAlign',
  () =>
    (...args) =>
      mockGetPerspectiveForAlign(...args),
);

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

const mockFishEyeParam: FisheyeCameraParametersV4<'center'> = {
  d: [[1, 2, 3]],
  grids: { x: [0, 100, 10], y: [0, 100, 10] },
  k: [[2, 2, 3]],
  ret: 0.1,
  rvec: [[3, 2, 3]],
  rvec_polyfits: { center: [[3, 2, 3]] },
  tvec: [[4, 2, 3]],
  tvec_polyfits: { center: [[4, 2, 3]] },
  v: 4,
};

const mockSetupFisheyePreview = jest.fn();

import Align from './Align';
import { bm2FullAreaPerspectiveGrid } from '../common/solvePnPConstants';

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
    mockFisheyePreviewManagerV4.mockImplementation(() => ({
      setupFisheyePreview: mockSetupFisheyePreview,
    }));
    mockDoorChecker.mockImplementation(() => ({
      destroy: mockDestroyDoorChecker,
      doorClosedWrapper: mockDoorClosedWrapper,
      keepClosed: true,
    }));
    mockDoorClosedWrapper.mockImplementation(async (fn) => await fn());
    mockGetCurrentDevice.mockReturnValue({
      info: { model: 'ado1' },
    });
    mockSetupFisheyePreview.mockResolvedValue(true);
  });

  it('should render correctly', async () => {
    mockTakeOnePicture.mockResolvedValue({ imgBlob: 'blob' });
    mockCreateObjectURL.mockReturnValue('file://url');
    mockGetCurrentDevice.mockReturnValue({
      info: { model: 'fbm2' },
    });

    const { baseElement, getByText, unmount } = render(
      <Align fisheyeParam={mockFishEyeParam} onBack={mockOnBack} onClose={mockOnClose} title="title" />,
    );

    expect(baseElement.querySelector('img').src).toBe('');
    await waitFor(() => {
      expect(baseElement.querySelector('.ant-modal')).not.toHaveClass('ant-zoom-appear');
      expect(baseElement.querySelector('img').src).not.toBe('');
    });
    expect(mockConnectCamera).toHaveBeenCalledTimes(1);
    expect(mockFisheyePreviewManagerV4).toHaveBeenCalledTimes(1);
    expect(mockFisheyePreviewManagerV4).toHaveBeenLastCalledWith(
      { model: 'fbm2' },
      mockFishEyeParam,
      bm2FullAreaPerspectiveGrid,
    );
    expect(mockDoorChecker).toHaveBeenCalledTimes(1);
    expect(mockSetupFisheyePreview).toHaveBeenCalledTimes(1);
    expect(mockTakeOnePicture).toHaveBeenCalledTimes(1);
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    expect(mockCreateObjectURL).toHaveBeenLastCalledWith('blob');
    expect(mockFisheyePreviewManagerV2).not.toHaveBeenCalled();
    expect(mockGetPerspectiveForAlign).not.toHaveBeenCalled();
    expect(mockSetFisheyeMatrix).not.toHaveBeenCalled();
    expect(baseElement).toMatchSnapshot();
    fireEvent.click(getByText('Show Last Result'));
    expect(baseElement.querySelector('.last')).toBeInTheDocument();
    unmount();
    expect(mockDestroyDoorChecker).toHaveBeenCalledTimes(1);
  });

  test('onBack, onClose', async () => {
    mockTakeOnePicture.mockResolvedValue({ imgBlob: 'blob' });
    mockCreateObjectURL.mockReturnValue('file://url');

    const { baseElement, getByText } = render(
      <Align fisheyeParam={mockFishEyeParam} onBack={mockOnBack} onClose={mockOnClose} title="title" />,
    );

    expect(baseElement.querySelector('img').src).toBe('');
    await waitFor(() => {
      expect(baseElement.querySelector('img').src).not.toBe('');
    });

    expect(mockOnBack).toHaveBeenCalledTimes(0);
    fireEvent.click(getByText('Back'));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
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

    expect(imgContainer.scrollLeft).toBe(1075);
    expect(imgContainer.scrollTop).toBe(750);
    fireEvent.change(xInput, { target: { value: 10 } });
    expect(imgContainer.scrollLeft).toBe(1125);
    fireEvent.change(yInput, { target: { value: 10 } });
    expect(imgContainer.scrollTop).toBe(800);
    fireEvent.click(getByText('Use Last Calibration Value'));
    expect(imgContainer.scrollLeft).toBe(1075);
    expect(imgContainer.scrollTop).toBe(750);
    fireEvent.scroll(imgContainer, { target: { scrollLeft: 975, scrollTop: 850 } });
    expect(xInput).toHaveValue(-20);
    expect(yInput).toHaveValue(20);
    fireEvent.click(getByText('Done'));
    expect(mockUpdateModuleOffsets).toHaveBeenCalledTimes(1);
    expect(mockUpdateModuleOffsets).toHaveBeenLastCalledWith([-20, 20], {
      isRelative: true,
      module: LayerModule.PRINTER,
      shouldWrite: true,
      workarea: 'ado1',
    });
  });
});
