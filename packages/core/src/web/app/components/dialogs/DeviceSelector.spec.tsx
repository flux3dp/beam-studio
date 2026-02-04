import React from 'react';

import { act, fireEvent, render } from '@testing-library/react';

import DeviceSelector from './DeviceSelector';

const mockGetSelectedDevice = jest.fn();

jest.mock('@core/app/components/beambox/TopBar/contexts/TopBarController', () => ({
  getSelectedDevice: () => mockGetSelectedDevice(),
}));

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => mockPopUp(...args),
}));

const mockToggleUnsavedChangedDialog = jest.fn();

jest.mock('@core/helpers/file/export', () => ({
  toggleUnsavedChangedDialog: (...args) => mockToggleUnsavedChangedDialog(...args),
}));

const mockRegister = jest.fn();
const mockUnregister = jest.fn();

jest.mock('@core/helpers/api/discover', () => ({
  discoverManager: {
    register: (...args) => mockRegister(...args),
  },
  SEND_DEVICES_INTERVAL: 5000,
}));

describe('should render correctly', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockRegister.mockReturnValue(mockUnregister);
  });

  test('no devices', () => {
    const mockOnSelect = jest.fn();
    const mockOnClose = jest.fn();
    const { baseElement, getByTestId, unmount } = render(
      <DeviceSelector onClose={mockOnClose} onSelect={mockOnSelect} />,
    );

    expect(baseElement).toMatchSnapshot();
    expect(mockRegister).toHaveBeenCalledTimes(1);
    expect(mockRegister).toHaveBeenLastCalledWith('device-selector', expect.anything());

    const [, discoverListener] = mockRegister.mock.calls[0];
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

    expect(mockOnSelect).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
    fireEvent.click(getByTestId('serial'));
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenLastCalledWith(mockDevice);
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    unmount();
    expect(mockUnregister).toHaveBeenCalledTimes(1);
  });
});
