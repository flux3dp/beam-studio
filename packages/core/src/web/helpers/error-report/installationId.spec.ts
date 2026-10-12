import storage from '@core/implementations/storage';

const mockMachineId = jest.fn();

jest.mock('@core/implementations/os', () => ({ machineId: () => mockMachineId() }));

import { getInstallationId } from './installationId';

describe('getInstallationId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storage.clearAll();
  });

  test('uses the OS machine id when available and does not touch storage', () => {
    mockMachineId.mockReturnValue('a'.repeat(64));
    expect(getInstallationId()).toBe('a'.repeat(64));
    expect(storage.get('error-report-install-id')).toBeUndefined();
  });

  test('falls back to a stored random id when the machine id is empty, and keeps it', () => {
    mockMachineId.mockReturnValue('');
    expect(getInstallationId()).toBe('mock-uuid-v4');
    expect(storage.get('error-report-install-id')).toBe('mock-uuid-v4');

    storage.set('error-report-install-id', 'kept-from-before');
    expect(getInstallationId()).toBe('kept-from-before');
  });

  test('a throwing machine id is treated as empty', () => {
    mockMachineId.mockImplementation(() => {
      throw new Error('boom');
    });
    expect(getInstallationId()).toBe('mock-uuid-v4');
  });
});
