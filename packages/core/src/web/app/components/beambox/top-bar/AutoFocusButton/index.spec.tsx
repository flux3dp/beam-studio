import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';

// Mock modules that cause issues in Jest
jest.mock('bcp-47', () => ({
  parse: jest.fn(),
}));

jest.mock('@core/helpers/locale-helper', () => ({
  detectLocale: jest.fn(),
}));

jest.mock('@core/helpers/announcement-helper', () => ({}));

jest.mock('@core/helpers/websocket', () =>
  jest.fn(() => ({
    close: jest.fn(),
    onClose: jest.fn(),
    onError: jest.fn(),
    onMessage: jest.fn(),
    send: jest.fn(),
  })),
);

jest.mock('@core/helpers/api/discover', () => ({
  getLatestMachineInfo: jest.fn(),
  getMachineInfo: jest.fn(),
  poke: jest.fn(),
}));

jest.mock('@core/app/actions/beambox/font-funcs', () => ({
  requestFontsOfTheFontFamily: jest.fn(),
}));

jest.mock('@core/app/actions/dialog-caller', () => ({
  showConfirmPromptDialog: jest.fn(),
}));

jest.mock('@core/app/actions/beambox/beambox-global-interaction', () => ({}));

jest.mock('@core/app/actions/canvas/curveEngravingModeController', () => ({}));

jest.mock('@core/helpers/beam-file-helper', () => ({}));

jest.mock('@core/helpers/fileImportHelper', () => ({}));

import AutoFocusButton from './index';
import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useCameraPreviewStore } from '@core/app/stores/cameraPreview';

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

const mockOpenMessage = jest.fn();

jest.mock('@core/app/actions/message-caller', () => ({
  openMessage: (...args) => mockOpenMessage(...args),
}));

const mockOpenNonstopProgress = jest.fn();
const mockUpdate = jest.fn();
const mockPopById = jest.fn();

jest.mock('@core/app/actions/progress-caller', () => ({
  openNonstopProgress: (...args) => mockOpenNonstopProgress(...args),
  popById: (...args) => mockPopById(...args),
  update: (...args) => mockUpdate(...args),
}));

const mockAlertConfigRead = jest.fn();
const mockAlertConfigWrite = jest.fn();

jest.mock('@core/helpers/api/alert-config', () => ({
  read: (...args) => mockAlertConfigRead(...args),
  write: (...args) => mockAlertConfigWrite(...args),
}));

const mockCheckDeviceStatus = jest.fn();

jest.mock(
  '@core/helpers/check-device-status',
  () =>
    (...args) =>
      mockCheckDeviceStatus(...args),
);

const mockSelect = jest.fn();
const mockGetControl = jest.fn();
const mockEnterRawMode = jest.fn();
const mockRawSetRotary = jest.fn();
const mockRawHome = jest.fn();
const mockRawMove = jest.fn();
const mockRawAutoFocus = jest.fn();
const mockRawUnlock = jest.fn();
const mockRawWaitOkResponse = jest.fn();
const mockGetDeviceDetailInfo = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  currentDevice: null,
  enterRawMode: (...args) => mockEnterRawMode(...args),
  getControl: (...args) => mockGetControl(...args),
  getDeviceDetailInfo: (...args) => mockGetDeviceDetailInfo(...args),
  rawAutoFocus: (...args) => mockRawAutoFocus(...args),
  rawHome: (...args) => mockRawHome(...args),
  rawMove: (...args) => mockRawMove(...args),
  rawSetRotary: (...args) => mockRawSetRotary(...args),
  rawUnlock: (...args) => mockRawUnlock(...args),
  rawWaitOkResponse: (...args) => mockRawWaitOkResponse(...args),
  select: (...args) => mockSelect(...args),
}));

jest.mock('@core/helpers/eventEmitterFactory', () => ({
  createEventEmitter: () => ({
    on: jest.fn(),
    removeListener: jest.fn(),
  }),
}));

const mockOn = jest.fn();

jest.mock('@core/helpers/shortcuts', () => ({
  on: (...args) => mockOn(...args),
}));

jest.mock('@core/helpers/symbol-helper/symbolMaker', () => ({
  switchImageSymbolForAll: jest.fn(),
}));

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) => {
    callback({ Canvas: { clearSelection: jest.fn() } });
  },
}));

jest.mock('@core/app/constants/workarea-constants', () => ({
  getWorkarea: (_model: string) => ({
    autoFocusOffset: [10, 10, 0],
    height: 500,
    width: 400,
  }),
}));

jest.mock('@core/app/actions/beambox/constant', () => ({
  dpmm: 10,
  needToShowProbeBeforeAutoFocusModelsArray: ['fbb2'],
  supportAutoFocusModels: new Set(['fhexa1', 'ado1', 'fad1', 'fbb2', 'fhx2rf', 'fbm2']),
}));

const mockToggleAutoFocus = jest.fn();

jest.mock('@core/app/stores/canvas/utils/autoFocus', () => ({
  toggleAutoFocus: (...args) => mockToggleAutoFocus(...args),
}));

describe('AutoFocusButton', () => {
  const defaultContextValue = {
    currentUser: null,
    hasPassthroughExtension: false,
    hasUnsavedChange: false,
    isColorPreviewing: false,
    isPathEditing: false,
    selectedDevice: { model: 'fad1', name: 'Test Device' },
    setIsColorPreviewing: jest.fn(),
    setIsPathEditing: jest.fn(),
    setMode: jest.fn(),
    setSelectedDevice: jest.fn(),
    toggleAutoFocus: jest.fn(),
    updateCanvasContext: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAlertConfigRead.mockReturnValue(false);
    mockCheckDeviceStatus.mockResolvedValue(true);
    mockSelect.mockResolvedValue({ success: true });
    mockGetControl.mockReturnValue({ getMode: () => 'raw' });
    mockGetDeviceDetailInfo.mockResolvedValue({ probe_showed: '1' });
    useCanvasStore.setState({ mode: CanvasMode.Draw });
  });

  const renderComponent = (contextValue = {}) => {
    return render(
      <CanvasContext.Provider value={{ ...defaultContextValue, ...contextValue } as any}>
        <AutoFocusButton />
      </CanvasContext.Provider>,
    );
  };

  describe('Rendering', () => {
    it('should render the button with correct styles when device supports auto focus', () => {
      const { container } = renderComponent();
      const button = container.querySelector('.button');

      expect(button).toBeInTheDocument();
      expect(button).not.toHaveClass('disabled');
    });

    it('should render disabled when device does not support auto focus', () => {
      const { container } = renderComponent({
        selectedDevice: { model: 'unsupported', name: 'Test Device' },
      });
      const button = container.querySelector('.button');

      expect(button).toHaveClass('disabled');
    });

    it('should render disabled when mode is not Draw', () => {
      useCameraPreviewStore.setState({ isPreviewMode: true });

      const { container } = renderComponent();
      const button = container.querySelector('.button');

      expect(button).toHaveClass('disabled');
    });
  });

  describe('Click handling', () => {
    it('should handle click when button is enabled', () => {
      const { container } = renderComponent();
      const button = container.querySelector('.button');

      // Check button is not disabled
      expect(button).not.toHaveClass('disabled');

      fireEvent.click(button);

      // At least the progress should start
      expect(mockOpenNonstopProgress).toHaveBeenCalledWith({
        id: 'auto-focus',
        message: expect.any(String),
      });
    });

    it('should handle successful auto focus flow', async () => {
      // Mock alert config to skip warning
      mockAlertConfigRead.mockReturnValue(true);

      const { container } = renderComponent();
      const button = container.querySelector('.button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOpenNonstopProgress).toHaveBeenCalledWith({
          id: 'auto-focus',
          message: expect.any(String),
        });
      });

      await waitFor(() => {
        expect(mockSelect).toHaveBeenCalledWith(defaultContextValue.selectedDevice);
        expect(mockCheckDeviceStatus).toHaveBeenCalledWith(defaultContextValue.selectedDevice);
      });

      await waitFor(() => {
        expect(mockToggleAutoFocus).toHaveBeenCalledWith(true);
        expect(mockRawSetRotary).toHaveBeenCalledWith(false);
        expect(mockRawHome).toHaveBeenCalled();
      });
    });

    it('should show error when device selection fails', async () => {
      mockSelect.mockResolvedValue({ success: false });

      const { container } = renderComponent();
      const button = container.querySelector('.button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockPopUp).toHaveBeenCalledWith(
          expect.objectContaining({
            type: expect.stringContaining('ERROR'),
          }),
        );
        expect(mockToggleAutoFocus).not.toHaveBeenCalledWith(true);
        expect(mockPopById).toHaveBeenCalledWith('auto-focus');
      });
    });

    it('should show error when device status check fails', async () => {
      mockCheckDeviceStatus.mockResolvedValue(false);

      const { container } = renderComponent();
      const button = container.querySelector('.button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockPopUp).toHaveBeenCalledWith(
          expect.objectContaining({
            type: expect.stringContaining('ERROR'),
          }),
        );
        expect(mockToggleAutoFocus).not.toHaveBeenCalledWith(true);
      });
    });

    it('should show warning dialog when skip_auto_focus_warning is false', async () => {
      mockAlertConfigRead.mockReturnValue(false);
      mockPopUp.mockImplementation(({ callbacks }) => {
        callbacks[1](); // Click continue
      });

      const { container } = renderComponent();
      const button = container.querySelector('.button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockPopUp).toHaveBeenCalledWith(
          expect.objectContaining({
            checkbox: expect.objectContaining({ text: expect.any(String) }),
            id: 'auto_focus_warning',
            type: expect.stringContaining('WARNING'),
          }),
        );
        expect(mockToggleAutoFocus).toHaveBeenCalledWith(true);
      });
    });

    it('should cancel operation when user cancels warning dialog', async () => {
      mockAlertConfigRead.mockReturnValue(false);
      mockPopUp.mockImplementation(({ callbacks }) => {
        if (callbacks && callbacks[0]) {
          callbacks[0](); // Click cancel
        }
      });

      const { container } = renderComponent();
      const button = container.querySelector('.button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockPopUp).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockToggleAutoFocus).not.toHaveBeenCalledWith(true);
        expect(mockPopById).toHaveBeenCalledWith('auto-focus');
      });
    });

    it('should not proceed when already processing', () => {
      const { container } = renderComponent();
      const button = container.querySelector('.button');

      // First click
      fireEvent.click(button);

      // Clear the mock to check second click
      mockOpenNonstopProgress.mockClear();

      // Second click while processing
      fireEvent.click(button);

      // Should not call progress again
      expect(mockOpenNonstopProgress).not.toHaveBeenCalled();
    });

    it('should not proceed when in AutoFocus mode', () => {
      useCanvasStore.setState({ mode: CanvasMode.AutoFocus });

      const { container } = renderComponent();
      const button = container.querySelector('.button');

      fireEvent.click(button);

      expect(mockOpenNonstopProgress).not.toHaveBeenCalled();
    });
  });

  describe('Device-specific behavior', () => {
    it('should unlock for fhexa1 device', async () => {
      mockAlertConfigRead.mockReturnValue(true);

      const { container } = renderComponent({
        selectedDevice: { model: 'fhexa1', name: 'HEXA Device' },
      });
      const button = container.querySelector('.button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockRawUnlock).toHaveBeenCalled();
      });
    });

    it('should check probe for devices requiring probe', async () => {
      mockAlertConfigRead.mockReturnValue(true);

      const { container } = renderComponent({
        selectedDevice: { model: 'fbb2', name: 'BB2 Device' },
      });
      const button = container.querySelector('.button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockGetDeviceDetailInfo).toHaveBeenCalled();
      });
    });

    it('should show error when probe is not shown for devices requiring it', async () => {
      mockAlertConfigRead.mockReturnValue(true); // Skip warning dialog
      mockGetDeviceDetailInfo.mockResolvedValue({ probe_showed: '0' });

      const { container } = renderComponent({
        selectedDevice: { model: 'fbb2', name: 'BB2 Device' },
      });
      const button = container.querySelector('.button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockPopUp).toHaveBeenCalledWith(
          expect.objectContaining({
            type: expect.stringContaining('ERROR'),
          }),
        );
        expect(mockToggleAutoFocus).not.toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Keyboard shortcuts', () => {
    it('should register Escape key handler in AutoFocus mode', () => {
      useCanvasStore.setState({ mode: CanvasMode.AutoFocus });

      renderComponent({});

      expect(mockOn).toHaveBeenCalledWith(['Escape'], expect.any(Function), { isBlocking: true });
    });

    it('should toggle auto focus off on Escape key', () => {
      useCanvasStore.setState({ mode: CanvasMode.AutoFocus });
      renderComponent({});

      const escapeHandler = mockOn.mock.calls[0][1];

      escapeHandler();

      expect(mockToggleAutoFocus).toHaveBeenCalledWith(false);
    });

    it('should unregister shortcut handler on unmount', () => {
      const mockUnregister = jest.fn();

      useCanvasStore.setState({ mode: CanvasMode.AutoFocus });
      mockOn.mockReturnValue(mockUnregister);

      const { unmount } = renderComponent();

      unmount();

      expect(mockUnregister).toHaveBeenCalled();
    });
  });

  describe('Progress updates', () => {
    it('should update progress messages during setup', async () => {
      mockAlertConfigRead.mockReturnValue(true);

      const { container } = renderComponent();
      const button = container.querySelector('.button');

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith('auto-focus', {
          message: expect.any(String), // enteringRawMode message
        });
        expect(mockUpdate).toHaveBeenCalledWith('auto-focus', {
          message: expect.any(String), // exitingRotaryMode message
        });
        expect(mockUpdate).toHaveBeenCalledWith('auto-focus', {
          message: expect.any(String), // homing message
        });
      });
    });
  });
});
