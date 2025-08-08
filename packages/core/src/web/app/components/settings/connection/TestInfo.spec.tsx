import React from 'react';

import { render } from '@testing-library/react';

import { TestState } from '@core/app/constants/connection-test';

import TestInfo from './TestInfo';

jest.mock('@core/helpers/useI18n', () => () => ({
  initialize: {
    connect_machine_ip: {
      check_camera: 'check_camera',
      check_connection: 'check_connection',
      check_firmware: 'check_firmware',
      check_ip: 'check_ip',
      invalid_format: 'invalid_format',
      invalid_ip: 'invalid_ip',
      succeeded_message: 'succeeded_message',
      unreachable: 'unreachable',
    },
  },
}));

const STATES_TO_TEST = [
  { state: TestState.NONE, text: 'none' },
  { state: TestState.IP_FORMAT_ERROR, text: 'ip format error' },
  { state: TestState.IP_TESTING, text: 'ip testing' },
  { state: TestState.IP_UNREACHABLE, text: 'ip unreachable' },
  { state: TestState.CONNECTION_TESTING, text: 'connection testing' },
  { state: TestState.CAMERA_TESTING, text: 'camera testing' },
  { state: TestState.CAMERA_TEST_FAILED, text: 'camera test failed' },
  { state: TestState.TEST_COMPLETED, text: 'test completed' },
];

describe('test TestInfo', () => {
  it.each(STATES_TO_TEST)('should correctly when state is $text', ({ state }) => {
    const { container } = render(<TestInfo connectionCountDown={10} firmwareVersion="4.0.0" testState={state} />);

    expect(container).toMatchSnapshot();
  });
});
