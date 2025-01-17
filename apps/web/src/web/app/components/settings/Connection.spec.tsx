import React from 'react';
import { fireEvent, render } from '@testing-library/react';

jest.mock('helpers/i18n', () => ({
  lang: {
    settings: {
      ip: 'Machine IP Address',
      guess_poke: 'Search for machine IP address',
      auto_connect: 'Automatically select the only machine',
      wrong_ip_format: 'Wrong IP Formats',
      groups: {
        connection: 'Connection',
      },
      help_center_urls: {
        connection: 'https://support.flux3dp.com/hc/en-us/sections/360000302135',
      },
    },
  },
}));

const popUp = jest.fn();
jest.mock('app/actions/alert-caller', () => ({
  popUp,
}));

const open = jest.fn();
jest.mock('implementations/browser', () => ({
  open,
}));

const get = jest.fn();
jest.mock('implementations/storage', () => ({
  get,
}));

jest.mock('app/components/settings/Control', () => 'mock-control');

jest.mock('app/components/settings/SelectControl', () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ id, label, onChange, options }: any) => (
    <div>
      mock-select-control id:{id}
      label:{label}
      options:{JSON.stringify(options)}
      <input className="select-control" onChange={onChange} />
    </div>
  )
);

// eslint-disable-next-line import/first
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
        originalIP="192.168.1.1"
        guessingPokeOptions={[
          {
            value: 'TRUE',
            label: 'On',
            selected: true,
          },
          {
            value: 'FALSE',
            label: 'Off',
            selected: false,
          },
        ]}
        autoConnectOptions={[
          {
            value: 'TRUE',
            label: 'On',
            selected: false,
          },
          {
            value: 'FALSE',
            label: 'Off',
            selected: true,
          },
        ]}
        updateConfigChange={updateConfigChange}
      />
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
      type: 'SHOW_POPUP_ERROR',
      message: 'Wrong IP Formats\n192.168.1111.111',
    });
    expect(updateConfigChange).not.toHaveBeenCalled();

    fireEvent.click(container.querySelector('img'));
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenNthCalledWith(
      1,
      'https://support.flux3dp.com/hc/en-us/sections/360000302135'
    );

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
        originalIP="192.168.1.1"
        guessingPokeOptions={[
          {
            value: 'TRUE',
            label: 'On',
            selected: true,
          },
          {
            value: 'FALSE',
            label: 'Off',
            selected: false,
          },
        ]}
        autoConnectOptions={[
          {
            value: 'TRUE',
            label: 'On',
            selected: false,
          },
          {
            value: 'FALSE',
            label: 'Off',
            selected: true,
          },
        ]}
        updateConfigChange={updateConfigChange}
      />
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
    expect(updateConfigChange).toHaveBeenNthCalledWith(
      1,
      'poke-ip-addr',
      '192.168.3.3;192.168.4.4'
    );
  });
});
