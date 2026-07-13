import type { AutoSaveConfig } from '@core/interfaces/AutoSaveConfig';

const mockGetStorage = jest.fn();
const mockSetStorage = jest.fn();

// storageStore is inline-mocked here (instead of relying on the central __mocks__) because the
// module reads config dynamically via getStorage and registers a subscription at import time; the
// tests need to drive both the returned config and the (no-op) subscription deterministically.
jest.mock('@core/app/stores/storageStore', () => ({
  getStorage: (...args: any[]) => mockGetStorage(...args),
  setStorage: (...args: any[]) => mockSetStorage(...args),
  useStorageStore: { subscribe: jest.fn(() => () => {}) },
}));

const mockIsWeb = jest.fn();

jest.mock('@core/helpers/is-web', () => () => mockIsWeb());

const mockIsAtPage = jest.fn();

jest.mock('@core/helpers/hashHelper', () => ({
  isAtPage: (...args: any[]) => mockIsAtPage(...args),
}));

const mockGenerateBeamBuffer = jest.fn();

jest.mock('@core/helpers/file/export', () => ({
  generateBeamBuffer: (...args: any[]) => mockGenerateBeamBuffer(...args),
}));

const mockGetHasUnsavedChanges = jest.fn();

jest.mock('@core/app/svgedit/currentFileManager', () => ({
  getHasUnsavedChanges: (...args: any[]) => mockGetHasUnsavedChanges(...args),
}));

jest.mock('@core/app/actions/tabController', () => ({ currentId: 42 }));

const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({ popUp: (...args: any[]) => mockPopUp(...args) }));

const mockShowSettingsModal = jest.fn();

jest.mock('@core/app/components/settings', () => ({
  SettingCategory: { AUTOSAVE: 'autosave' },
  showSettingsModal: (...args: any[]) => mockShowSettingsModal(...args),
}));

const mockJoin = jest.fn();
const mockGetPath = jest.fn();
const mockMkdir = jest.fn();
const mockWriteStream = jest.fn();
const mockExists = jest.fn();
const mockReaddirSync = jest.fn();
const mockDelete = jest.fn();

jest.mock('@core/implementations/fileSystem', () => ({
  delete: (...args: any[]) => mockDelete(...args),
  exists: (...args: any[]) => mockExists(...args),
  getPath: (...args: any[]) => mockGetPath(...args),
  join: (...args: any[]) => mockJoin(...args),
  mkdir: (...args: any[]) => mockMkdir(...args),
  readdirSync: (...args: any[]) => mockReaddirSync(...args),
  writeStream: (...args: any[]) => mockWriteStream(...args),
}));

// i18n is auto-resolved via central __mocks__ (real en.ts); do NOT re-mock.

import autoSaveHelper from './auto-save-helper';

const baseConfig: AutoSaveConfig = {
  directory: '/docs/Beam Studio/auto-save',
  enabled: true,
  fileNumber: 5,
  timeInterval: 10,
};

describe('auto-save-helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsWeb.mockReturnValue(false);
    mockIsAtPage.mockReturnValue(true);
    mockGetStorage.mockReturnValue({ ...baseConfig });
    // join concatenates its parts so paths are inspectable in assertions.
    mockJoin.mockImplementation((...parts: string[]) => parts.join('/'));
    mockGetPath.mockReturnValue('/docs');
    mockExists.mockReturnValue(true);
    mockReaddirSync.mockReturnValue([]);
    mockGenerateBeamBuffer.mockResolvedValue(Buffer.from('beam'));
  });

  afterEach(() => {
    // Ensure no interval leaks across tests (module holds a single module-level timer).
    autoSaveHelper.toggleAutoSave(false);
    jest.useRealTimers();
  });

  describe('getConfig', () => {
    test('returns stored config when present', () => {
      const stored = { ...baseConfig, timeInterval: 3 };

      mockGetStorage.mockReturnValue(stored);

      expect(autoSaveHelper.getConfig()).toEqual(stored);
      expect(mockGetStorage).toHaveBeenCalledWith('auto-save-config');
    });

    test('falls back to default config (enabled, 5 files, 10 min) when unset', () => {
      mockGetStorage.mockReturnValue(undefined);

      const config = autoSaveHelper.getConfig();

      expect(config).toEqual({
        directory: '/docs/Beam Studio/auto-save',
        enabled: true,
        fileNumber: 5,
        timeInterval: 10,
      });
    });
  });

  describe('setConfig', () => {
    test('writes config under the auto-save-config storage key', () => {
      autoSaveHelper.setConfig(baseConfig);

      expect(mockSetStorage).toHaveBeenCalledWith('auto-save-config', baseConfig);
    });
  });

  describe('init', () => {
    test('applies default config when none stored', async () => {
      mockGetStorage.mockReturnValue(undefined);

      autoSaveHelper.init();

      // init fires applyDefaultConfig (async, not awaited); flush microtasks so its awaited
      // fs.mkdir resolves before asserting.
      await Promise.resolve();
      await Promise.resolve();

      // applyDefaultConfig creates the directory and persists the default config.
      expect(mockMkdir).toHaveBeenCalledWith('/docs/Beam Studio/auto-save', true);
      expect(mockSetStorage).toHaveBeenCalledWith('auto-save-config', expect.objectContaining({ enabled: true }));
    });

    test('does nothing when a config is already stored', () => {
      mockGetStorage.mockReturnValue({ ...baseConfig });

      autoSaveHelper.init();

      expect(mockMkdir).not.toHaveBeenCalled();
      expect(mockSetStorage).not.toHaveBeenCalled();
    });
  });

  describe('applyDefaultConfig', () => {
    test('disables auto-save when directory creation fails', async () => {
      mockMkdir.mockRejectedValueOnce(new Error('EACCES'));

      await autoSaveHelper.applyDefaultConfig();

      expect(mockSetStorage).toHaveBeenCalledWith('auto-save-config', expect.objectContaining({ enabled: false }));
    });

    test('writes a temp file to prompt permission and persists default config', async () => {
      await autoSaveHelper.applyDefaultConfig();

      expect(mockWriteStream).toHaveBeenCalledWith(expect.stringContaining('/docs/Beam Studio/auto-save'), 'a');
      expect(mockSetStorage).toHaveBeenCalledWith('auto-save-config', expect.objectContaining({ enabled: true }));
    });
  });

  describe('toggleAutoSave', () => {
    beforeEach(() => jest.useFakeTimers());

    test('does nothing on web', () => {
      mockIsWeb.mockReturnValue(true);

      autoSaveHelper.toggleAutoSave(true);
      jest.advanceTimersByTime(10 * 60 * 1000);

      expect(mockGenerateBeamBuffer).not.toHaveBeenCalled();
    });

    test('enabled config: saves after the configured interval elapses', async () => {
      mockGetStorage.mockReturnValue({ ...baseConfig });

      autoSaveHelper.toggleAutoSave(true);

      expect(mockGenerateBeamBuffer).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(10 * 60 * 1000);

      expect(mockGenerateBeamBuffer).toHaveBeenCalledTimes(1);
      // Writes the generated buffer to a .beam file in the configured directory.
      expect(mockWriteStream).toHaveBeenCalledWith(
        expect.stringContaining('/docs/Beam Studio/auto-save/beam-studio autosave-'),
        'w',
        [expect.anything()],
      );
      // Filename carries the current tab id.
      expect(mockWriteStream.mock.calls[0][0]).toContain('-42.beam');
    });

    test('disabled config: no interval is started, no save fires', () => {
      mockGetStorage.mockReturnValue({ ...baseConfig, enabled: false });

      autoSaveHelper.toggleAutoSave(true);
      jest.advanceTimersByTime(10 * 60 * 1000);

      expect(mockGenerateBeamBuffer).not.toHaveBeenCalled();
    });

    test('does not save when not on the editor page', async () => {
      mockGetStorage.mockReturnValue({ ...baseConfig });
      mockIsAtPage.mockReturnValue(false);

      autoSaveHelper.toggleAutoSave(true);
      await jest.advanceTimersByTimeAsync(10 * 60 * 1000);

      expect(mockGenerateBeamBuffer).not.toHaveBeenCalled();
    });

    test('starting twice does not create a second interval (no double-fire)', async () => {
      mockGetStorage.mockReturnValue({ ...baseConfig });

      autoSaveHelper.toggleAutoSave(true);
      autoSaveHelper.toggleAutoSave(true); // guarded by !autoSaveInterval

      await jest.advanceTimersByTimeAsync(10 * 60 * 1000);

      expect(mockGenerateBeamBuffer).toHaveBeenCalledTimes(1);
    });

    test('stop clears the timer: no further saves after stopping', async () => {
      mockGetStorage.mockReturnValue({ ...baseConfig });

      autoSaveHelper.toggleAutoSave(true);
      await jest.advanceTimersByTimeAsync(10 * 60 * 1000);
      expect(mockGenerateBeamBuffer).toHaveBeenCalledTimes(1);

      autoSaveHelper.toggleAutoSave(false);
      await jest.advanceTimersByTimeAsync(3 * 10 * 60 * 1000);

      expect(mockGenerateBeamBuffer).toHaveBeenCalledTimes(1);
    });

    test('new interval value takes effect after stop + restart', async () => {
      mockGetStorage.mockReturnValue({ ...baseConfig, timeInterval: 10 });
      autoSaveHelper.toggleAutoSave(true);

      // Restart with a shorter interval.
      autoSaveHelper.toggleAutoSave(false);
      mockGetStorage.mockReturnValue({ ...baseConfig, timeInterval: 2 });
      autoSaveHelper.toggleAutoSave(true);

      // After 2 minutes the new (shorter) cadence fires; the old 10-min timer was cleared.
      await jest.advanceTimersByTimeAsync(2 * 60 * 1000);

      expect(mockGenerateBeamBuffer).toHaveBeenCalledTimes(1);
    });

    test('prunes oldest files down to fileNumber limit before writing', async () => {
      mockGetStorage.mockReturnValue({ ...baseConfig, fileNumber: 2 });
      // 4 autosave files present; keeping 2 means 3 delete-loop iterations (i <= len - fileNumber).
      mockReaddirSync.mockReturnValue([
        'beam-studio autosave-2020-01-01 00-00-00-1.beam',
        'beam-studio autosave-2020-01-02 00-00-00-1.beam',
        'beam-studio autosave-2020-01-03 00-00-00-1.beam',
        'beam-studio autosave-2020-01-04 00-00-00-1.beam',
        'unrelated.txt',
      ]);

      autoSaveHelper.toggleAutoSave(true);
      await jest.advanceTimersByTimeAsync(10 * 60 * 1000);

      expect(mockDelete).toHaveBeenCalled();

      // The unrelated file is never a delete target.
      const deletedPaths = mockDelete.mock.calls.map((c) => c[0]);

      expect(deletedPaths.some((p: string) => p.includes('unrelated.txt'))).toBe(false);
    });

    test('alerts and skips saving when the directory no longer exists', async () => {
      mockGetStorage.mockReturnValue({ ...baseConfig });
      mockExists.mockReturnValue(false);

      autoSaveHelper.toggleAutoSave(true);
      await jest.advanceTimersByTimeAsync(10 * 60 * 1000);

      expect(mockPopUp).toHaveBeenCalledWith(expect.objectContaining({ id: 'auto-save-directory-not-exist' }));
      expect(mockGenerateBeamBuffer).not.toHaveBeenCalled();
    });
  });
});
