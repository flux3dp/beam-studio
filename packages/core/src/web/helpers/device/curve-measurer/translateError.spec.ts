import { getHelpCenterURL } from '@core/helpers/help-center';

import translateErrorMessage from './translateError';

// `getHelpCenterURL` is mocked so this stays a pure unit test: the real module imports
// device-master (and its heavy worker/svgedit chain, which uses `import.meta` and cannot load
// under ts-jest). translateError delegates ALL link resolution — including language — to
// getHelpCenterURL, so here we only assert it forwards that result and calls it with the code +
// current-device keyRef. Language/article resolution itself is covered by help-center's own tests.
jest.mock('@core/helpers/help-center', () => ({
  getHelpCenterURL: jest.fn(),
}));

// `i18n.lang` resolves to the real en.ts via the central `@core/helpers/i18n` mock, so the
// curve_engraving message strings below are the actual en copy.
const mockGetHelpCenterURL = jest.mocked(getHelpCenterURL);

describe('translateErrorMessage', () => {
  beforeEach(() => {
    mockGetHelpCenterURL.mockReset();
  });

  test('maps a coded error (error#921) to its message and forwards the help link', () => {
    const link = 'https://support.flux3dp.com/hc/en-us/articles/921';

    mockGetHelpCenterURL.mockReturnValue(link);

    const res = translateErrorMessage('some prefix error#921 tail');

    expect(res.code).toBe('921');
    // en.ts curve_engraving['921'] === 'Failed to auto focus.'
    expect(res.message).toBe('#921 Failed to auto focus.');
    expect(res.link).toBe(link);
    // The link is resolved for the currently connected device.
    expect(mockGetHelpCenterURL).toHaveBeenCalledWith(921, { keyRef: ['current_device'] });
  });

  test('maps error#922 to the red-light measurement message and forwards the link', () => {
    const link = 'https://support.flux3dp.com/hc/en-us/articles/922';

    mockGetHelpCenterURL.mockReturnValue(link);

    const res = translateErrorMessage('error#922');

    expect(res.code).toBe('922');
    expect(res.message).toBe('#922 Failed to perform red-light measurement.');
    expect(res.link).toBe(link);
    expect(mockGetHelpCenterURL).toHaveBeenCalledWith(922, { keyRef: ['current_device'] });
  });

  test('leaves the link undefined when getHelpCenterURL has no article for the code', () => {
    mockGetHelpCenterURL.mockReturnValue(undefined);

    const res = translateErrorMessage('error#999');

    expect(res.code).toBe('999');
    expect(res.link).toBeUndefined();
    expect(mockGetHelpCenterURL).toHaveBeenCalledWith(999, { keyRef: ['current_device'] });
  });

  test('maps an "object over range" message to the localized range error without a help link', () => {
    const res = translateErrorMessage('measurement failed: object over range');

    expect(res.code).toBeNull();
    expect(res.link).toBeUndefined();
    // en.ts curve_engraving.err_object_over_range
    expect(res.message).toBe('The object exceeds the measurment range.');
    expect(mockGetHelpCenterURL).not.toHaveBeenCalled();
  });

  test('passes through an unrecognized message verbatim', () => {
    const res = translateErrorMessage('totally unexpected failure');

    expect(res.code).toBeNull();
    expect(res.message).toBe('totally unexpected failure');
    expect(mockGetHelpCenterURL).not.toHaveBeenCalled();
  });

  test('falls back to "Unknown error" for a null message', () => {
    const res = translateErrorMessage(null);

    expect(res.code).toBeNull();
    expect(res.message).toBe('Unknown error');
    expect(mockGetHelpCenterURL).not.toHaveBeenCalled();
  });
});
