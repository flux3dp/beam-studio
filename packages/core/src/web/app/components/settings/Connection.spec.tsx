import React from 'react';
import { create } from 'zustand';
import { fireEvent, render } from '@testing-library/react';

jest.mock('@core/helpers/i18n', () => ({
  lang: {
    settings: {
      auto_connect: 'Automatically select the only machine',
      groups: {
        connection: 'Connection',
      },
      guess_poke: 'Search for machine IP address',
      help_center_urls: {
        connection: 'https://support.flux3dp.com/hc/en-us/sections/360000302135',
      },
      ip: 'Machine IP Address',
      wrong_ip_format: 'Wrong IP Formats',
    },
  },
}));

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

import Connection from './Connection';

describe('should render correctly', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('invalid ip address is given', async () => {
    mockGetConfig.mockReturnValue('192.168.2.2');

    const { container } = render(
      <Connection
        options={
          [
            { label: 'On', value: true },
            { label: 'Off', value: false },
          ] as any
        }
      />,
    );

    expect(container).toMatchSnapshot();
    expect(mockGetConfig).toHaveBeenCalledTimes(4);
    expect(mockGetConfig).toHaveBeenNthCalledWith(1, 'poke-ip-addr');

    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: '192.168.3.3;192.168.4.4;192.168.1111.111' } });
    fireEvent.blur(input);

    expect(popUp).toHaveBeenCalledTimes(1);
    expect(popUp).toHaveBeenNthCalledWith(1, {
      id: 'wrong-ip-error',
      message: 'Wrong IP Formats\n192.168.1111.111',
      type: 'SHOW_POPUP_ERROR',
    });
    expect(mockSetConfig).not.toHaveBeenCalled();

    fireEvent.click(container.querySelector('img'));
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenNthCalledWith(1, 'https://support.flux3dp.com/hc/en-us/sections/360000302135');

    const controls = container.querySelectorAll('.select-control');

    fireEvent.change(controls[0], { target: { value: false } });
    expect(mockSetConfig).toHaveBeenCalledTimes(1);
    expect(mockSetConfig).toHaveBeenNthCalledWith(1, 'guessing_poke', false);

    fireEvent.change(controls[1], { target: { value: true } });
    expect(mockSetConfig).toHaveBeenCalledTimes(2);
    expect(mockSetConfig).toHaveBeenNthCalledWith(2, 'auto_connect', true);
  });

  test('valid ip address is given', () => {
    mockGetConfig.mockReturnValue('192.168.1.1');

    const { container } = render(
      <Connection
        options={
          [
            { label: 'On', value: true },
            { label: 'Off', value: false },
          ] as any
        }
      />,
    );

    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: '192.168.3.3;192.168.4.4' } });
    fireEvent.blur(input);
    expect(popUp).not.toHaveBeenCalled();
    expect(mockSetConfig).toHaveBeenCalledTimes(1);
    expect(mockSetConfig).toHaveBeenNthCalledWith(1, 'poke-ip-addr', '192.168.3.3;192.168.4.4');
  });
});
