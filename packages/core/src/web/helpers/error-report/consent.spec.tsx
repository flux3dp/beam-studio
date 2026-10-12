import React from 'react';
import { render } from '@testing-library/react';

const mockGetUploadBlock = jest.fn();
const mockUploadErrorReport = jest.fn();

jest.mock('./index', () => ({
  getUploadBlock: (...args: any[]) => mockGetUploadBlock(...args),
  uploadErrorReport: (...args: any[]) => mockUploadErrorReport(...args),
}));

const mockGetErrorReportPreference = jest.fn();

jest.mock('./preference', () => ({ getErrorReportPreference: () => mockGetErrorReportPreference() }));

const mockAppend = jest.fn();

jest.mock('@core/helpers/logger', () => () => ({ append: (...args: any[]) => mockAppend(...args) }));

import { withErrorReportConsent } from './consent';

const alert = () => ({ buttonType: 'RETRY_CANCEL', message: '#802 backend down', onRetry: jest.fn() });
const options = { errorCode: '#802' };

describe('withErrorReportConsent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUploadBlock.mockReturnValue(null);
    mockUploadErrorReport.mockResolvedValue('sent');
  });

  test('never: returns the alert untouched and uploads nothing', () => {
    mockGetErrorReportPreference.mockReturnValue('never');

    const input = alert();

    expect(withErrorReportConsent(input, options)).toBe(input);
    expect(mockUploadErrorReport).not.toHaveBeenCalled();
    expect(mockGetUploadBlock).not.toHaveBeenCalled();
  });

  test.each(['cooldown', 'daily-limit'])('%s: returns the alert untouched under ask and always', (reason) => {
    mockGetUploadBlock.mockReturnValue(reason);

    for (const preference of ['ask', 'always']) {
      mockGetErrorReportPreference.mockReturnValue(preference);

      const input = alert();

      expect(withErrorReportConsent(input, options)).toBe(input);
    }

    expect(mockUploadErrorReport).not.toHaveBeenCalled();
  });

  test('ask: adds a consent checkbox that fires on any button and starts the upload', () => {
    mockGetErrorReportPreference.mockReturnValue('ask');

    const input = alert();
    const result = withErrorReportConsent(input, options);

    expect(result).not.toBe(input);
    expect(input.checkbox).toBeUndefined();
    expect(result).toMatchObject({ ...input, alwaysTriggerCheckboxCallbacks: true });
    expect(result.checkbox?.text).toBe(
      'Send diagnostic data to FLUX to help fix this error (no design files or personal data)',
    );
    expect(typeof result.checkbox?.callbacks).toBe('function');
    expect(result.children).toBeUndefined();
    expect(mockUploadErrorReport).not.toHaveBeenCalled();

    (result.checkbox!.callbacks as Function)();
    expect(mockUploadErrorReport).toHaveBeenCalledWith(options);
  });

  test('ask: never replaces an existing checkbox', () => {
    mockGetErrorReportPreference.mockReturnValue('ask');

    const input = { ...alert(), checkbox: { callbacks: jest.fn(), text: 'Do not show again' } };

    expect(withErrorReportConsent(input, options)).toBe(input);
    expect(mockUploadErrorReport).not.toHaveBeenCalled();
  });

  test('always: uploads at once, adds the status line, and keeps an existing checkbox', () => {
    mockGetErrorReportPreference.mockReturnValue('always');

    const existing = { callbacks: jest.fn(), text: 'Do not show again' };
    const input = { ...alert(), checkbox: existing };
    const result = withErrorReportConsent(input, options);

    expect(mockUploadErrorReport).toHaveBeenCalledWith(options);
    expect(result.checkbox).toBe(existing);
    expect(result.onRetry).toBe(input.onRetry);

    const { container } = render(<>{result.children}</>);

    expect(container.textContent).toBe('Diagnostic data sent to FLUX automatically.');
  });

  test('isolation: every dependency throwing returns the input alert unchanged', () => {
    mockGetErrorReportPreference.mockImplementation(() => {
      throw new Error('storage broken');
    });

    const input = alert();
    const snapshot = { ...input };

    expect(withErrorReportConsent(input, options)).toBe(input);
    expect(input).toEqual(snapshot);
    expect(mockAppend).toHaveBeenCalledWith(expect.stringContaining('consent skipped #802'));

    mockGetErrorReportPreference.mockReturnValue('always');
    mockGetUploadBlock.mockImplementation(() => {
      throw new Error('throttle broken');
    });
    expect(withErrorReportConsent(input, options)).toBe(input);
  });
});
