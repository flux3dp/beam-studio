const mockGet = jest.fn();

jest.mock('@core/implementations/storage', () => ({ get: (...args: any[]) => mockGet(...args) }));

const mockSetStorage = jest.fn();

jest.mock('@core/app/stores/storageStore', () => ({ setStorage: (...args: any[]) => mockSetStorage(...args) }));

jest.mock('@core/app/stores/globalPreferenceStore', () => ({ useGlobalPreferenceStore: { getState: () => ({}) } }));

import { useSettingStore } from './useSettingStore';

describe('useSettingStore.getConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSettingStore.getState().resetChanges();
  });

  test('unset key with a default: writes and returns the default', () => {
    mockGet.mockReturnValue(undefined);

    expect(useSettingStore.getState().getConfig('enable-sentry')).toBe(false);
    expect(mockSetStorage).toHaveBeenCalledWith('enable-sentry', false);
  });

  test('unset key without a default: returns undefined and writes nothing', () => {
    mockGet.mockReturnValue(null);

    expect(useSettingStore.getState().getConfig('error-report-upload')).toBeUndefined();
    expect(mockSetStorage).not.toHaveBeenCalled();
  });

  test('stored value wins over the default', () => {
    mockGet.mockReturnValue('never');

    expect(useSettingStore.getState().getConfig('error-report-upload')).toBe('never');
    expect(mockSetStorage).not.toHaveBeenCalled();
  });
});
