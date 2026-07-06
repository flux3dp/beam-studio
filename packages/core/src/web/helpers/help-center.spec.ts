const mockGetActiveLang = jest.fn();

jest.mock('./i18n', () => ({
  getActiveLang: mockGetActiveLang,
}));

const deviceMasterMock: { currentDevice: null | { info: { model?: string } } } = { currentDevice: null };

jest.mock('./device-master', () => ({
  get currentDevice() {
    return deviceMasterMock.currentDevice;
  },
}));

const mockGetSelectedDevice = jest.fn();

jest.mock('@core/app/components/beambox/TopBar/contexts/TopBarController', () => ({
  getSelectedDevice: mockGetSelectedDevice,
}));

const mockGetState = jest.fn();

jest.mock('@core/app/stores/documentStore', () => ({
  useDocumentStore: {
    getState: mockGetState,
  },
}));

import { getHelpCenterURL, HELP_CENTER_ARTICLES, resolveArticle, resolveKey } from './help-center';

beforeEach(() => {
  jest.clearAllMocks();
  mockGetActiveLang.mockReturnValue('en');
  deviceMasterMock.currentDevice = null;
  mockGetSelectedDevice.mockReturnValue(null);
  mockGetState.mockReturnValue({ workarea: 'fbm1' });
});

describe('resolveKey', () => {
  test('uses explicit key when provided', () => {
    expect(resolveKey('ado1')).toBe('ado1');
  });

  test('falls back to common when no key and no ref', () => {
    expect(resolveKey()).toBe('common');
  });

  test('resolves key from current_device model', () => {
    deviceMasterMock.currentDevice = { info: { model: 'fbb1b' } };
    expect(resolveKey(undefined, ['current_device'])).toBe('fbb1b');
  });

  test('resolves key from selected_device model', () => {
    mockGetSelectedDevice.mockReturnValue({ model: 'fhexa1' });
    expect(resolveKey(undefined, ['selected_device'])).toBe('fhexa1');
  });

  test('resolves key from workarea', () => {
    mockGetState.mockReturnValue({ workarea: 'fbm2' });
    expect(resolveKey(undefined, ['workarea'])).toBe('fbm2');
  });

  test('tries refs in order and skips ones without a model', () => {
    deviceMasterMock.currentDevice = null; // current_device has no model
    mockGetSelectedDevice.mockReturnValue({ model: 'fbm1' });
    expect(resolveKey(undefined, ['current_device', 'selected_device'])).toBe('fbm1');
  });

  test('falls back to common when refs yield no model', () => {
    deviceMasterMock.currentDevice = null;
    mockGetSelectedDevice.mockReturnValue(null);
    expect(resolveKey(undefined, ['current_device', 'selected_device'])).toBe('common');
  });
});

describe('resolveArticle', () => {
  test('tries keys in order and skips ones without an article', () => {
    expect(resolveArticle(HELP_CENTER_ARTICLES[901], ['ado1', 'fbb1b'], 'en-us')).toBe(HELP_CENTER_ARTICLES[901].ado1);
    expect(resolveArticle(HELP_CENTER_ARTICLES[922], ['fbm2', 'common'], 'en-us')).toBe(
      HELP_CENTER_ARTICLES[922].common,
    );
  });

  test('checks MISSING_TRANSLATIONS with given language', () => {
    // Mock data for testing
    expect(resolveArticle({ common: -123 }, ['common'], 'ok_lang' as any)).toBe(-123);
    expect(resolveArticle({ common: -123 }, ['common'], '_test' as any)).toBe(undefined);
  });
});

describe('getHelpCenterURL language handling', () => {
  test('maps zh-tw active lang to zh-tw path', () => {
    mockGetActiveLang.mockReturnValue('zh-tw');
    expect(getHelpCenterURL(801)).toContain('/zh-tw/articles/');
  });

  test('maps jp active lang to en-us path', () => {
    mockGetActiveLang.mockReturnValue('jp');
    expect(getHelpCenterURL(801)).toContain('/en-us/articles/');
  });

  test('maps zh-cn active lang to en-us path', () => {
    mockGetActiveLang.mockReturnValue('zh-cn');
    expect(getHelpCenterURL(801)).toContain('/en-us/articles/');
  });

  test('explicit lang option overrides active lang', () => {
    mockGetActiveLang.mockReturnValue('en');
    expect(getHelpCenterURL(801, { lang: 'zh-tw' })).toContain('/zh-tw/articles/');
    expect(mockGetActiveLang).not.toHaveBeenCalled();
  });
});

describe('getHelpCenterURL fallback behavior', () => {
  test('returns home URL when no article and allowHome is true', () => {
    expect(getHelpCenterURL(99999, { allowHome: true })).toMatch(/\/en-us$/);
  });

  test('returns undefined when no article and allowHome is not set', () => {
    expect(getHelpCenterURL(99999)).toBeUndefined();
  });
});
