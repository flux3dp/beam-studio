// TODO: List all possible reason for
export enum ConnectionError {
  TIMEOUT = 'TIMEOUT',
  UNKNOWN_DEVICE = 'UNKNOWN_DEVICE',
  NOT_FOUND = 'NOT_FOUND',
  DISCONNECTED = 'DISCONNECTED',
  AUTH_ERROR = 'AUTH_ERROR',
  AUTH_FAILED = 'AUTH_FAILED',
  UPDATE_SERIAL_FAILED = 'UPDATE_SERIAL_FAILED',
}

export interface SelectionResult {
  success: boolean;
  error?: ConnectionError;
}
