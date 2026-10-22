import React from 'react';
import { render } from '@testing-library/react';

const mockGetUploadBlock = jest.fn();
const mockUploadErrorReport = jest.fn();

jest.mock('./index', () => ({
  getUploadBlock: (...args: any[]) => mockGetUploadBlock(...args),
  uploadErrorReport: (...args: any[]) => mockUploadErrorReport(...args),
}));

const mockGetErrorReportPreference = jest.fn();
const mockHasChosen = jest.fn();
const mockSetPreference = jest.fn();

jest.mock('./preference', () => ({
  getErrorReportPreference: () => mockGetErrorReportPreference(),
  hasChosenErrorReportPreference: () => mockHasChosen(),
  setErrorReportPreference: (...args: any[]) => mockSetPreference(...args),
}));

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({ popUp: (...args: any[]) => mockPopUp(...args) }));

const mockOpenMessage = jest.fn();

jest.mock('@core/app/actions/message-caller', () => ({
  __esModule: true,
  default: { openMessage: (...args: any[]) => mockOpenMessage(...args) },
  MessageLevel: { SUCCESS: 'SUCCESS' },
}));

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
    mockHasChosen.mockReturnValue(true);
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

  const tick = async () => {
    mockGetErrorReportPreference.mockReturnValue('ask');
    await (withErrorReportConsent(alert(), options).checkbox!.callbacks as () => void)();
    await Promise.resolve();
  };

  test('ask: a sent upload shows the neutral toast; a chosen preference means no prompt', async () => {
    await tick();

    expect(mockOpenMessage).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'Thanks! Diagnostic data sent.', key: 'error-report-sent' }),
    );
    expect(mockPopUp).not.toHaveBeenCalled();
  });

  test('ask: first sent upload with no preference chosen prompts once; buttons store ask / always', async () => {
    mockHasChosen.mockReturnValue(false);
    await tick();

    expect(mockPopUp).toHaveBeenCalledTimes(1);

    const prompt = mockPopUp.mock.calls[0][0];

    expect(prompt).toMatchObject({
      buttonLabels: ['Ask each time', 'Always send'],
      caption: 'Send automatically?',
      id: 'error-report-always-prompt',
      primaryButtonIndex: 1,
    });
    expect(prompt.message).toContain('Preferences > Privacy');

    prompt.callbacks[0]();
    prompt.callbacks[1]();
    expect(mockSetPreference.mock.calls).toEqual([['ask'], ['always']]);
  });

  test('ask: duplicate, failed or blocked uploads show neither toast nor prompt', async () => {
    mockHasChosen.mockReturnValue(false);

    for (const result of ['duplicate', 'failed', 'cooldown']) {
      mockUploadErrorReport.mockResolvedValueOnce(result);
      await tick();
    }

    expect(mockOpenMessage).not.toHaveBeenCalled();
    expect(mockPopUp).not.toHaveBeenCalled();
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
    expect(mockOpenMessage).not.toHaveBeenCalled();

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
