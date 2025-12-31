import React from 'react';
import { create } from 'zustand';
import { fireEvent, render } from '@testing-library/react';

const popUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({ popUp }));

const open = jest.fn();

jest.mock('@core/implementations/browser', () => ({ open }));

const mockGetConfig = jest.fn();
const mockSetConfig = jest.fn();

const useSettingStore = create(() => ({ getConfig: mockGetConfig, setConfig: mockSetConfig }));

jest.mock('@core/app/pages/Settings/useSettingStore', () => ({ useSettingStore }));
jest.mock('./components/SettingSelect');
jest.mock('./components/SettingFormItem');
jest.mock('./components/SettingSwitch');

import Connection from './Connection';

describe('should render correctly', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('invalid ip address is given', async () => {
    mockGetConfig.mockReturnValue('192.168.2.2');

    const { container } = render(<Connection />);

    expect(container).toMatchSnapshot();
    expect(mockGetConfig).toHaveBeenCalledTimes(3);
    expect(mockGetConfig).toHaveBeenNthCalledWith(1, 'poke-ip-addr');

    // Find the IP input inside the ip-list section (not the switch controls)
    const ipSection = container.querySelector('#connect-ip-list');
    const input = ipSection.querySelector('input');

    fireEvent.change(input, { target: { value: '192.168.1111.111' } });
    fireEvent.blur(input);

    expect(popUp).toHaveBeenCalledTimes(1);
    expect(popUp).toHaveBeenNthCalledWith(1, {
      id: 'wrong-ip-error',
      message: 'Wrong IP Formats\n192.168.1111.111',
      type: 'SHOW_POPUP_ERROR',
    });
    expect(mockSetConfig).not.toHaveBeenCalled();

    const switchControls = container.querySelectorAll('.switch-control');

    // mockGetConfig returns '192.168.2.2' which is truthy, so clicking toggles to false
    fireEvent.click(switchControls[0]);
    expect(mockSetConfig).toHaveBeenCalledTimes(1);
    expect(mockSetConfig).toHaveBeenNthCalledWith(1, 'guessing_poke', false);

    fireEvent.click(switchControls[1]);
    expect(mockSetConfig).toHaveBeenCalledTimes(2);
    expect(mockSetConfig).toHaveBeenNthCalledWith(2, 'auto_connect', false);
  });

  test('valid ip address is given', () => {
    mockGetConfig.mockReturnValue('192.168.1.1');

    const { container } = render(<Connection />);

    // Find the IP input inside the ip-list section (not the switch controls)
    const ipSection = container.querySelector('#connect-ip-list');
    const input = ipSection.querySelector('input');

    fireEvent.change(input, { target: { value: '192.168.3.3' } });
    fireEvent.blur(input);
    expect(popUp).not.toHaveBeenCalled();
    expect(mockSetConfig).toHaveBeenCalledTimes(1);
    expect(mockSetConfig).toHaveBeenNthCalledWith(1, 'poke-ip-addr', '192.168.3.3');
  });
});
