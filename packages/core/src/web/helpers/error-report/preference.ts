import storage from '@core/implementations/storage';
import type { ErrorReportUploadPreference } from '@core/interfaces/IStorage';

/** Unset (never chosen) behaves as 'ask'; only the one-time prompt cares about the difference. */
export const DEFAULT_ERROR_REPORT_PREFERENCE: ErrorReportUploadPreference = 'ask';

export const getErrorReportPreference = (): ErrorReportUploadPreference =>
  storage.get('error-report-upload') ?? DEFAULT_ERROR_REPORT_PREFERENCE;
