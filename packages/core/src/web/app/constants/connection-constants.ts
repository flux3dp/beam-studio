// TODO: List all possible reason for
export enum ConnectionError {
  AUTH_ERROR = 'AUTH_ERROR',
  AUTH_FAILED = 'AUTH_FAILED',
  DISCONNECTED = 'DISCONNECTED',
  NOT_FOUND = 'NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN_DEVICE = 'UNKNOWN_DEVICE',
  UPDATE_SERIAL_FAILED = 'UPDATE_SERIAL_FAILED',
}

export interface SelectionResult {
  error?: ConnectionError;
  success: boolean;
}
