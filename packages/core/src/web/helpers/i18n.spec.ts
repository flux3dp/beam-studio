const mockGetStorage = jest.fn();
const mockSetStorage = jest.fn();
const mockSubscribe = jest.fn();

jest.mock('@core/app/stores/storageStore', () => ({
  getStorage: (...args) => mockGetStorage(...args),
  setStorage: (...args) => mockSetStorage(...args),
  useStorageStore: {
    subscribe: (...args) => mockSubscribe(...args),
  },
}));

let i18n;

const resetI18n = () => {
  jest.resetModules();
  jest.clearAllMocks();
  i18n = require('./i18n').default;
};

describe('test i18n', () => {
  beforeEach(() => {
    resetI18n();
  });

  test('setActiveLang', () => {
    // Test the default language
    expect(i18n.getActiveLang()).toBe('en');
    expect(mockGetStorage).toHaveBeenCalledTimes(1);
    expect(mockGetStorage).toHaveBeenNthCalledWith(1, 'active-lang');

    // Test setting a new language
    i18n.setActiveLang('zh-tw');

    // Verify that `mockSet` was called correctly
    expect(mockSetStorage).toHaveBeenCalledTimes(1);
    expect(mockSetStorage).toHaveBeenNthCalledWith(1, 'active-lang', 'zh-tw');

    // Test a translation
    expect(i18n.lang.topbar.untitled).toBe('未命名');
  });

  test('subscribe', () => {
    i18n.setActiveLang('zh-tw');
    expect(i18n.lang.topbar.untitled).toBe('未命名');

    const [selector, callback] = mockSubscribe.mock.calls[0];

    callback(selector({ 'active-lang': 'en' }));
    expect(i18n.lang.topbar.untitled).toBe('Untitled');
  });
});
