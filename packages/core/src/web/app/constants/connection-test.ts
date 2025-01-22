// intentionally set testing states odd, failed and completed states even
enum TestState {
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

export const isTesting = (state: TestState): boolean => state % 2 === 1;

export default TestState;
