import React from 'react';

import { act, fireEvent, render } from '@testing-library/react';

import DeviceSelector from './DeviceSelector';

const mockGetSelectedDevice = jest.fn();

jest.mock('@core/app/views/beambox/TopBar/contexts/TopBarController', () => ({
  getSelectedDevice: () => mockGetSelectedDevice(),
}));

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

const mockToggleUnsavedChangedDialog = jest.fn();

jest.mock('@core/helpers/file-export-helper', () => ({
  toggleUnsavedChangedDialog: (...args) => mockToggleUnsavedChangedDialog(...args),
}));

jest.mock('@core/helpers/i18n', () => ({
  getActiveLang: () => 'en',
  lang: {
    alert: {
      cancel: 'Cancel',
    },
    machine_status: {
      '-17': 'Cartridge IO Mode',
      '-10': 'Maintain mode',
      '-2': 'Scanning',
      '-1': 'Maintaining',
      0: 'Idle',
      1: 'Initiating',
      2: 'ST_TRANSFORM',
      4: 'Starting',
      6: 'Resuming',
      16: 'Working',
      18: 'Resuming',
      32: 'Paused',
      36: 'Paused',
      38: 'Pausing',
      48: 'Paused',
      50: 'Pausing',
      64: 'Completed',
      66: 'Completing',
      68: 'Preparing',
      128: 'Aborted',
      UNKNOWN: 'Unknown',
    },
    select_device: {
      select_device: 'Select Device',
    },
    topbar: {
      select_machine: 'Select a machine',
    },
  },
}));

const mockDiscover = jest.fn();

jest.mock(
  '@core/helpers/api/discover',
  () =>
    (...args) =>
      mockDiscover(...args),
);

describe('should render correctly', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('no devices', () => {
    const mockRemoveListener = jest.fn();

    mockDiscover.mockReturnValue({
      removeListener: mockRemoveListener,
    });

    const mockOnSelect = jest.fn();
    const mockOnClose = jest.fn();
    const { baseElement, getByTestId, unmount } = render(
      <DeviceSelector onClose={mockOnClose} onSelect={mockOnSelect} />,
    );

    expect(baseElement).toMatchSnapshot();
    expect(mockDiscover).toHaveBeenCalledTimes(1);
    expect(mockDiscover).toHaveBeenLastCalledWith('device-selector', expect.anything());

    const [, discoverListener] = mockDiscover.mock.calls[0];
    const mockDevice = {
      name: 'name',
      serial: 'serial',
      st_id: 1,
      uuid: 'uuid',
    };

    act(() => {
      discoverListener([mockDevice]);
    });
    expect(baseElement).toMatchSnapshot();

    expect(mockOnSelect).not.toBeCalled();
    expect(mockOnClose).not.toBeCalled();
    fireEvent.click(getByTestId('serial'));
    expect(mockOnSelect).toBeCalledTimes(1);
    expect(mockOnSelect).toHaveBeenLastCalledWith(mockDevice);
    expect(mockOnClose).toBeCalledTimes(1);

    unmount();
    expect(mockRemoveListener).toHaveBeenCalledTimes(1);
    expect(mockRemoveListener).toHaveBeenNthCalledWith(1, 'device-selector');
  });
});
