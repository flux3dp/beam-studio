import React from 'react';

import { act, fireEvent, render } from '@testing-library/react';

import NetworkTestingPanel from './NetworkTestingPanel';

jest.mock('@core/helpers/i18n', () => ({
  lang: {
    beambox: {
      network_testing_panel: {
        average_response: 'Average Response Time',
        cannot_connect_1: '#840 Fail to connect to target IP.',
        cannot_connect_2: '#840 Fail to connect to target IP. Please make sure that the target is in the same network.',
        cannot_get_local: 'Access to local IP address failed.',
        connection_quality: 'Connection Quality',
        device_not_on_list: 'device_not_on_list',
        empty_ip: '#818 Please enter target device IP first.',
        end: 'End',
        fail_to_start_network_test: '#817 Fail to start network testing.',
        hint_connect_camera_timeout: 'Timeout occurs when starting camera preview?',
        hint_connect_failed_when_sending_job: 'Failed to connect when sending a job?',
        hint_device_often_on_list: 'The machine is often not found on the list?',
        insert_ip: 'Target device IP address:',
        invalid_ip: '#818 Invalid IP address',
        ip_startswith_169: '#843 Machine IP address starts with 169.254',
        link_connect_camera_timeout: 'https://support.flux3dp.com/hc/en-us/articles/360001791895',
        link_connect_failed_when_sending_job: 'https://support.flux3dp.com/hc/en-us/articles/360001841656',
        link_device_often_on_list: 'https://support.flux3dp.com/hc/en-us/articles/360001841636',
        linux_permission_hint: 'linux_permission_hint',
        local_ip: 'Local IP address:',
        network_testing: 'Network Testing',
        network_unhealthy: '#841 Connection quality <70 or average response time >100ms',
        start: 'Start',
        test_completed: 'Test Completed',
        test_fail: 'Test Failed',
        testing: 'Testing Network...',
      },
    },
  },
}));

const mockNetworkTest = jest.fn();

jest.mock('@core/implementations/network', () => ({
  networkTest: (...args) => mockNetworkTest(...args),
}));

const mockPoke = jest.fn();
const mockRegister = jest.fn();
const mockUnregister = jest.fn();

jest.mock('@core/helpers/api/discover', () => ({
  discoverManager: {
    poke: (...args) => mockPoke(...args),
    register: (...args) => mockRegister(...args),
  },
}));

jest.mock('@core/implementations/os', () => ({
  networkInterfaces: () => ({
    en0: [
      {
        address: '192.168.68.2',
        family: 'IPv4',
        internal: false,
      },
    ],
  }),
}));

const mockOnClose = jest.fn();

mockRegister.mockReturnValue(mockUnregister);

describe('test NetworkTestingPanel', () => {
  it('should render correctly', async () => {
    const { baseElement, getByText, unmount } = render(
      <NetworkTestingPanel ip="192.168.68.163" onClose={mockOnClose} />,
    );

    expect(baseElement).toMatchSnapshot();
    expect(baseElement.querySelector('input')).toHaveValue('192.168.68.163');

    mockNetworkTest.mockResolvedValue({ avgRRT: 30, quality: 70, successRate: 90 });
    fireEvent.keyDown(baseElement.querySelector('input'), { key: 'Enter' });
    expect(mockNetworkTest).toHaveBeenCalledTimes(1);
    expect(mockNetworkTest).toHaveBeenLastCalledWith('192.168.68.163', 30000, expect.any(Function));
    expect(mockPoke).toHaveBeenCalledTimes(1);
    expect(mockPoke).toHaveBeenLastCalledWith('192.168.68.163');

    baseElement.querySelector('input').value = '192.168.68.3';
    await act(async () => {
      fireEvent.click(getByText('Start'));
    });
    expect(mockNetworkTest).toHaveBeenCalledTimes(2);
    expect(mockNetworkTest).toHaveBeenLastCalledWith('192.168.68.3', 30000, expect.any(Function));
    expect(mockPoke).toHaveBeenCalledTimes(2);
    expect(mockPoke).toHaveBeenLastCalledWith('192.168.68.3');

    expect(mockUnregister).not.toHaveBeenCalled();
    unmount();
    expect(mockUnregister).toHaveBeenCalledTimes(1);
  });
});
