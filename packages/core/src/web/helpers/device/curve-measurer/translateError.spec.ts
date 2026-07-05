import { HELP_CENTER_URLS } from '@core/app/constants/alert-constants';

import translateErrorMessage from './translateError';

// The central i18n mock (`@core/helpers/i18n`) resolves `i18n.lang` to the real en.ts and
// `getActiveLang()` to 'en'. We import it normally (no inline re-mock — see unit-test skill)
// and use jest.spyOn to vary getActiveLang for the zh-tw link-rewrite case.
import i18n from '@core/helpers/i18n';

describe('translateErrorMessage', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('maps a coded error (error#921) to its message and help link', () => {
    const res = translateErrorMessage('some prefix error#921 tail');

    expect(res.code).toBe('921');
    // en.ts curve_engraving['921'] === 'Failed to auto focus.'
    expect(res.message).toBe('#921 Failed to auto focus.');
    expect(res.link).toBe(HELP_CENTER_URLS['921']);
  });

  test('maps error#922 to the red-light measurement message and link', () => {
    const res = translateErrorMessage('error#922');

    expect(res.code).toBe('922');
    expect(res.message).toBe('#922 Failed to perform red-light measurement.');
    expect(res.link).toBe(HELP_CENTER_URLS['922']);
  });

  test('rewrites the help link to zh-tw when active language is zh-tw', () => {
    jest.spyOn(i18n, 'getActiveLang').mockReturnValue('zh-tw');

    const res = translateErrorMessage('error#921');

    expect(res.code).toBe('921');
    expect(res.link).toBe(HELP_CENTER_URLS['921'].replace('en-us', 'zh-tw'));
  });

  test('leaves the link untouched when a coded error has no help URL entry', () => {
    // 999 is not present in HELP_CENTER_URLS
    const res = translateErrorMessage('error#999');

    expect(res.code).toBe('999');
    expect(res.link).toBeUndefined();
  });

  test('maps an "object over range" message to the localized range error', () => {
    const res = translateErrorMessage('measurement failed: object over range');

    expect(res.code).toBeNull();
    expect(res.link).toBeUndefined();
    // en.ts curve_engraving.err_object_over_range
    expect(res.message).toBe('The object exceeds the measurment range.');
  });

  test('passes through an unrecognized message verbatim', () => {
    const res = translateErrorMessage('totally unexpected failure');

    expect(res.code).toBeNull();
    expect(res.message).toBe('totally unexpected failure');
  });

  test('falls back to "Unknown error" for a null message', () => {
    const res = translateErrorMessage(null);

    expect(res.code).toBeNull();
    expect(res.message).toBe('Unknown error');
  });
});
