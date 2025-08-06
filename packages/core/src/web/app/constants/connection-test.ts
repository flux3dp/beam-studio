/**
 * Odd states indicate that a test is currently running.
 * Even states indicate that a test has completed or failed.
 */
export enum TestState {
  CAMERA_TEST_FAILED = 8,
  CAMERA_TESTING = 7, // Testing camera connection
  CONNECTION_TEST_FAILED = 6, // Failed at machine connection test
  CONNECTION_TESTING = 5, // Start to test machine connection
  IP_FORMAT_ERROR = 2, // Failed at format test
  IP_TESTING = 3, // Start to test machine connection
  IP_UNREACHABLE = 4, // Failed at ping test
  NONE = 0,
  TEST_COMPLETED = 10,
}

export const ConnectMachineFailedStates = [
  TestState.CONNECTION_TEST_FAILED,
  TestState.IP_FORMAT_ERROR,
  TestState.IP_UNREACHABLE,
] as const;

export const isTesting = (state: TestState): boolean => state % 2 === 1;
