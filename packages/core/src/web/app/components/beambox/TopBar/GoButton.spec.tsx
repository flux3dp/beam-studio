import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { CanvasMode } from '@core/app/constants/canvasMode';
import { CanvasContext } from '@core/app/contexts/CanvasContext';

import GoButton from './GoButton';

const popUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => popUp(...args),
}));

const alertConfigRead = jest.fn();
const write = jest.fn();

jest.mock('@core/helpers/api/alert-config', () => ({
  read: (...args) => alertConfigRead(...args),
  write: (...args) => write(...args),
}));

const showConfirmPromptDialog = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  showConfirmPromptDialog: (...args) => showConfirmPromptDialog(...args),
}));

const uploadFcode = jest.fn();

jest.mock('@core/app/actions/beambox/export-funcs', () => ({
  uploadFcode: (...args) => uploadFcode(...args),
}));

const switchImageSymbolForAll = jest.fn();

jest.mock('@core/helpers/symbol-helper/symbolMaker', () => ({
  switchImageSymbolForAll: (...args) => switchImageSymbolForAll(...args),
}));

jest.mock('@core/app/constants/tutorial-constants', () => ({
  SEND_FILE: 'SEND_FILE',
}));

const versionChecker = jest.fn();

jest.mock(
  '@core/helpers/version-checker',
  () =>
    (...args) =>
      versionChecker(...args),
);

const getNextStepRequirement = jest.fn();
const handleNextStep = jest.fn();

jest.mock('@core/app/components/tutorials/tutorialController', () => ({
  getNextStepRequirement: (...args) => getNextStepRequirement(...args),
  handleNextStep: (...args) => handleNextStep(...args),
}));

const mockExecuteFirmwareUpdate = jest.fn();

jest.mock('@core/app/actions/beambox/menuDeviceActions', () => ({
  executeFirmwareUpdate: (...args) => mockExecuteFirmwareUpdate(...args),
}));

const getCurrentDrawing = jest.fn();

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) =>
    callback({
      Canvas: {
        getCurrentDrawing: (...args) => getCurrentDrawing(...args),
      },
    }),
}));

jest.mock('@core/app/contexts/CanvasContext', () => ({
  CanvasContext: React.createContext(null),
}));

const mockCheckOldFirmware = jest.fn();

jest.mock(
  '@core/helpers/device/checkOldFirmware',
  () =>
    (...args) =>
      mockCheckOldFirmware(...args),
);

const mockCheckDeviceStatus = jest.fn();

jest.mock(
  '@core/helpers/check-device-status',
  () =>
    (...args) =>
      mockCheckDeviceStatus(...args),
);

const mockGetDevice = jest.fn();

jest.mock(
  '@core/helpers/device/get-device',
  () =>
    (...args) =>
      mockGetDevice(...args),
);

const mockSetStatus = jest.fn();
const mockHandleFinish = jest.fn();
const mockSetExportFn = jest.fn();
const mockOnContextChanged = jest.fn();

jest.mock('@core/helpers/device/promark/promark-button-handler', () => ({
  handleFinish: (...args) => mockHandleFinish(...args),
  onContextChanged: (...args) => mockOnContextChanged(...args),
  setExportFn: (...args) => mockSetExportFn(...args),
  setStatus: (...args) => mockSetStatus(...args),
}));

const mockHandleExportClick = jest.fn();

jest.mock('@core/app/actions/beambox/export/GoButton/handleExportClick', () => ({
  handleExportClick: (...args) => mockHandleExportClick(...args),
}));

describe('test GoButton', () => {
  test('should render correctly', () => {
    const mockExport = jest.fn();
    const mockDevice = { uuid: 'mock-device' };

    mockHandleExportClick.mockReturnValue(mockExport);

    const { container } = render(
      <CanvasContext value={{ selectedDevice: mockDevice } as any}>
        <GoButton hasDiscoverdMachine={false} />
      </CanvasContext>,
    );

    expect(container).toMatchSnapshot();
    expect(mockSetExportFn).toHaveBeenCalledTimes(1);
    expect(mockOnContextChanged).toHaveBeenCalledTimes(1);
    expect(mockOnContextChanged).toHaveBeenCalledWith(CanvasMode.Draw, mockDevice);

    expect(mockExport).not.toHaveBeenCalled();
    fireEvent.click(container.querySelector('.button'));
    expect(mockExport).toHaveBeenCalledTimes(1);
  });
});
