import React from 'react';
import { render } from '@testing-library/react';

import TestState from 'app/constants/connection-test';

import TestInfo from './TestInfo';

jest.mock('helpers/useI18n', () => () => ({
  initialize: {
    connect_machine_ip: {
      invalid_ip: 'invalid_ip',
      invalid_format: 'invalid_format',
      unreachable: 'unreachable',
      check_ip: 'check_ip',
      check_connection: 'check_connection',
      check_firmware: 'check_firmware',
      check_camera: 'check_camera',
      succeeded_message: 'succeeded_message',
    },
  },
}));

const STATES_TO_TEST = [
  { text: 'none', state: TestState.NONE },
  { text: 'ip format error', state: TestState.IP_FORMAT_ERROR },
  { text: 'ip testing', state: TestState.IP_TESTING },
  { text: 'ip unreachable', state: TestState.IP_UNREACHABLE },
  { text: 'connection testing', state: TestState.CONNECTION_TESTING },
  { text: 'camera testing', state: TestState.CAMERA_TESTING },
  { text: 'camera test failed', state: TestState.CAMERA_TEST_FAILED },
  { text: 'test completed', state: TestState.TEST_COMPLETED },
];

describe('test TestInfo', () => {
  it.each(STATES_TO_TEST)('should correctly when state is $text', ({ state }) => {
    const { container } = render(<TestInfo testState={state} firmwareVersion="4.0.0" connectionCountDown={10} />);
    expect(container).toMatchSnapshot();
  });
});
