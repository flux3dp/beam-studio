import React from 'react';

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

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp,
}));

const open = jest.fn();

jest.mock('@app/implementations/browser', () => ({
  open,
}));

const get = jest.fn();

jest.mock('@app/implementations/storage', () => ({
  get,
}));

jest.mock('@core/app/components/settings/Control', () => 'mock-control');

jest.mock('@core/app/components/settings/SelectControl', () => ({ id, label, onChange, options }: any) => (
  <div>
    mock-select-control id:{id}
    label:{label}
    options:{JSON.stringify(options)}
    <input className="select-control" onChange={onChange} />
  </div>
));

import Connection from './Connection';

describe('should render correctly', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('invalid ip address is given', async () => {
    get.mockReturnValue('192.168.2.2');

    const updateConfigChange = jest.fn();
    const { container } = render(
      <Connection
        autoConnectOptions={[
          {
            label: 'On',
            selected: false,
            value: 'TRUE',
          },
          {
            label: 'Off',
            selected: true,
            value: 'FALSE',
          },
        ]}
        guessingPokeOptions={[
          {
            label: 'On',
            selected: true,
            value: 'TRUE',
          },
          {
            label: 'Off',
            selected: false,
            value: 'FALSE',
          },
        ]}
        originalIP="192.168.1.1"
        updateConfigChange={updateConfigChange}
      />,
    );

    expect(container).toMatchSnapshot();
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenNthCalledWith(1, 'poke-ip-addr');

    const input = container.querySelector('input');

    fireEvent.change(input, {
      target: {
        value: '192.168.3.3;192.168.4.4;192.168.1111.111',
      },
    });
    fireEvent.blur(input);
    expect(popUp).toHaveBeenCalledTimes(1);
    expect(popUp).toHaveBeenNthCalledWith(1, {
      id: 'wrong-ip-error',
      message: 'Wrong IP Formats\n192.168.1111.111',
      type: 'SHOW_POPUP_ERROR',
    });
    expect(updateConfigChange).not.toHaveBeenCalled();

    fireEvent.click(container.querySelector('img'));
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenNthCalledWith(1, 'https://support.flux3dp.com/hc/en-us/sections/360000302135');

    const controls = container.querySelectorAll('.select-control');

    fireEvent.change(controls[0], {
      target: { value: 'FALSE' },
    });
    expect(updateConfigChange).toHaveBeenCalledTimes(1);
    expect(updateConfigChange).toHaveBeenNthCalledWith(1, 'guessing_poke', 'FALSE');

    fireEvent.change(controls[1], {
      target: { value: 'TRUE' },
    });
    expect(updateConfigChange).toHaveBeenCalledTimes(2);
    expect(updateConfigChange).toHaveBeenNthCalledWith(2, 'auto_connect', 'TRUE');
  });

  test('valid ip address is given', () => {
    get.mockReturnValue('192.168.2.2');

    const updateConfigChange = jest.fn();
    const { container } = render(
      <Connection
        autoConnectOptions={[
          {
            label: 'On',
            selected: false,
            value: 'TRUE',
          },
          {
            label: 'Off',
            selected: true,
            value: 'FALSE',
          },
        ]}
        guessingPokeOptions={[
          {
            label: 'On',
            selected: true,
            value: 'TRUE',
          },
          {
            label: 'Off',
            selected: false,
            value: 'FALSE',
          },
        ]}
        originalIP="192.168.1.1"
        updateConfigChange={updateConfigChange}
      />,
    );

    const input = container.querySelector('input');

    fireEvent.change(input, {
      target: {
        value: '192.168.3.3;192.168.4.4',
      },
    });
    fireEvent.blur(input);
    expect(popUp).not.toHaveBeenCalled();
    expect(updateConfigChange).toHaveBeenCalledTimes(1);
    expect(updateConfigChange).toHaveBeenNthCalledWith(1, 'poke-ip-addr', '192.168.3.3;192.168.4.4');
  });
});
