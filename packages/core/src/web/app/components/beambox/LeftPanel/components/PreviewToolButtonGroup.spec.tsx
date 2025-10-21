import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { CameraType } from '@core/app/constants/cameraConstants';

const emitShowCropper = jest.fn();

jest.mock('@core/app/stores/beambox-store', () => ({
  emitShowCropper,
}));

const isClean = jest.fn();
const resetCoordinates = jest.fn();
const clear = jest.fn();

jest.mock('@core/app/actions/beambox/preview-mode-background-drawer', () => ({
  clear,
  isClean,
  resetCoordinates,
}));

const mockUseCameraPreviewStore = jest.fn();

jest.mock('@core/app/stores/cameraPreview', () => ({
  useCameraPreviewStore: (...args) => mockUseCameraPreviewStore(...args),
}));

const mockSwitchCamera = jest.fn();
const mockToggleFullWorkareaLiveMode = jest.fn();
const mockResetFishEyeObjectHeight = jest.fn();

jest.mock('@core/app/actions/beambox/preview-mode-controller', () => ({
  resetFishEyeObjectHeight: (...args) => mockResetFishEyeObjectHeight(...args),
  switchCamera: (...args) => mockSwitchCamera(...args),
  toggleFullWorkareaLiveMode: (...args) => mockToggleFullWorkareaLiveMode(...args),
}));

const getSVGAsync = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync,
}));

const clearSelection = jest.fn();

getSVGAsync.mockImplementation((callback) => {
  callback({
    Canvas: {
      clearSelection,
    },
  });
});

const useWorkarea = jest.fn();

jest.mock('@core/helpers/hooks/useWorkarea', () => useWorkarea);

const mockStartCurveEngraving = jest.fn();

jest.mock('@core/app/actions/canvas/curveEngravingModeController', () => ({
  start: mockStartCurveEngraving,
}));

jest.mock('@core/app/contexts/CanvasContext', () => ({
  CanvasContext: React.createContext(null),
}));

const mockSetupPreviewMode = jest.fn();
const mockEndPreviewMode = jest.fn();

jest.mock('@core/app/stores/canvas/utils/previewMode', () => ({
  endPreviewMode: mockEndPreviewMode,
  setupPreviewMode: mockSetupPreviewMode,
}));

import PreviewToolButtonGroup from './PreviewToolButtonGroup';

const mockIsNorthAmerica = jest.fn();

jest.mock('@core/helpers/locale-helper', () => ({
  get isNorthAmerica() {
    return mockIsNorthAmerica();
  },
}));

describe('test PreviewToolButtonGroup', () => {
  beforeEach(() => {
    mockUseCameraPreviewStore.mockReturnValue({
      isPreviewMode: false,
    });
  });

  it('should render correctly', () => {
    const { container } = render(<PreviewToolButtonGroup className="left-toolbar" />);

    expect(container).toMatchSnapshot();
    expect(mockEndPreviewMode).not.toHaveBeenCalled();

    const back = container.querySelector('#preview-back');

    fireEvent.click(back);
    expect(mockEndPreviewMode).toHaveBeenCalledTimes(1);

    expect(mockSetupPreviewMode).not.toHaveBeenCalled();

    const shoot = container.querySelector('#preview-shoot');

    fireEvent.click(shoot);
    expect(mockSetupPreviewMode).toHaveBeenCalledTimes(1);
  });

  it('should render correctly when isNorthAmerica', () => {
    mockIsNorthAmerica.mockReturnValue(true);

    const { container } = render(<PreviewToolButtonGroup className="left-toolbar" />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when with wide angle camera', () => {
    mockUseCameraPreviewStore.mockReturnValue({
      hasWideAngleCamera: true,
      isPreviewMode: true,
      isWideAngleCameraCalibrated: true,
    });

    const { container } = render(<PreviewToolButtonGroup className="left-toolbar" />);

    expect(container).toMatchSnapshot();
    fireEvent.click(container.querySelectorAll('.option')[1]);
    expect(mockSwitchCamera).toHaveBeenCalled();
    expect(mockSwitchCamera).toHaveBeenCalledWith(CameraType.WIDE_ANGLE);
  });
});
