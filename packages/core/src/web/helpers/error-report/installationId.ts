/**
 * Per-computer identifier for error reports with no device serial (docs/prd/error-report-upload §7.1).
 * Prefers the hashed OS machine id; falls back to a random id generated once and kept in storage.
 * Never throws and never returns an empty string.
 */
import { v4 as uuid } from 'uuid';

import os from '@core/implementations/os';
import storage from '@core/implementations/storage';

export const getInstallationId = (): string => {
  let id = '';

  try {
    id = os.machineId();
  } catch {
    id = '';
  }

  if (id) return id;

  const stored = storage.get('error-report-install-id');

  if (stored) return stored;

  const fresh = uuid();

  storage.set('error-report-install-id', fresh);

  return fresh;
};
