import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';

import NetworkTestingPanel from './NetworkTestingPanel';

jest.mock('helpers/i18n', () => ({
  lang: {
    beambox: {
      network_testing_panel: {
        network_testing: 'Network Testing',
        local_ip: 'Local IP address:',
        insert_ip: 'Target device IP address:',
        empty_ip: '#818 Please enter target device IP first.',
        start: 'Start',
        end: 'End',
        testing: 'Testing Network...',
        invalid_ip: '#818 Invalid IP address',
        ip_startswith_169: '#843 Machine IP address starts with 169.254',
        connection_quality: 'Connection Quality',
        average_response: 'Average Response Time',
        test_completed: 'Test Completed',
        test_fail: 'Test Failed',
        cannot_connect_1: '#840 Fail to connect to target IP.',
        cannot_connect_2:
          '#840 Fail to connect to target IP. Please make sure that the target is in the same network.',
        network_unhealthy: '#841 Connection quality <70 or average response time >100ms',
        device_not_on_list: 'device_not_on_list',
        hint_device_often_on_list: 'The machine is often not found on the list?',
        link_device_often_on_list: 'https://support.flux3dp.com/hc/en-us/articles/360001841636',
        hint_connect_failed_when_sending_job: 'Failed to connect when sending a job?',
        link_connect_failed_when_sending_job:
          'https://support.flux3dp.com/hc/en-us/articles/360001841656',
        hint_connect_camera_timeout: 'Timeout occurs when starting camera preview?',
        link_connect_camera_timeout: 'https://support.flux3dp.com/hc/en-us/articles/360001791895',
        cannot_get_local: 'Access to local IP address failed.',
        fail_to_start_network_test: '#817 Fail to start network testing.',
        linux_permission_hint: 'linux_permission_hint',
      },
    },
  },
}));

const mockNetworkTest = jest.fn();
jest.mock('implementations/network', () => ({
  networkTest: (...args) => mockNetworkTest(...args),
}));

const mockPoke = jest.fn();
const mockPokeTcp = jest.fn();
const mockTestTcp = jest.fn();
const mockRemoveDiscover = jest.fn();
jest.mock('helpers/api/discover', () => {
  const ins = {
    poke: (ip: string) => mockPoke(ip),
    pokeTcp: (ip: string) => mockPokeTcp(ip),
    testTcp: (ip: string) => mockTestTcp(ip),
    removeListener: (id: string) => mockRemoveDiscover(id),
  };
  return () => ins;
});

jest.mock('implementations/os', () => ({
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
describe('test NetworkTestingPanel', () => {
  it('should render correctly', async () => {
    const { baseElement, getByText, unmount } = render(
      <NetworkTestingPanel onClose={mockOnClose} ip="192.168.68.163" />
    );
    expect(baseElement).toMatchSnapshot();
    expect(baseElement.querySelector('input')).toHaveValue('192.168.68.163');

    mockNetworkTest.mockResolvedValue({ successRate: 90, avgRRT: 30, quality: 70 });
    fireEvent.keyDown(baseElement.querySelector('input'), { key: 'Enter' });
    expect(mockNetworkTest).toHaveBeenCalledTimes(1);
    expect(mockNetworkTest).toHaveBeenLastCalledWith('192.168.68.163', 30000, expect.any(Function));
    expect(mockPoke).toHaveBeenCalledTimes(1);
    expect(mockPoke).toHaveBeenLastCalledWith('192.168.68.163');
    expect(mockPokeTcp).toHaveBeenCalledTimes(1);
    expect(mockPokeTcp).toHaveBeenLastCalledWith('192.168.68.163');
    expect(mockTestTcp).toHaveBeenCalledTimes(1);
    expect(mockTestTcp).toHaveBeenLastCalledWith('192.168.68.163');

    baseElement.querySelector('input').value = '192.168.68.3';
    await act(async () => {
      fireEvent.click(getByText('Start'));
    });
    expect(mockNetworkTest).toHaveBeenCalledTimes(2);
    expect(mockNetworkTest).toHaveBeenLastCalledWith('192.168.68.3', 30000, expect.any(Function));
    expect(mockPoke).toHaveBeenCalledTimes(2);
    expect(mockPoke).toHaveBeenLastCalledWith('192.168.68.3');
    expect(mockPokeTcp).toHaveBeenCalledTimes(2);
    expect(mockPokeTcp).toHaveBeenLastCalledWith('192.168.68.3');
    expect(mockTestTcp).toHaveBeenCalledTimes(2);
    expect(mockTestTcp).toHaveBeenLastCalledWith('192.168.68.3');

    expect(mockRemoveDiscover).not.toBeCalled();
    unmount();
    expect(mockRemoveDiscover).toHaveBeenCalledTimes(1);
  });
});
