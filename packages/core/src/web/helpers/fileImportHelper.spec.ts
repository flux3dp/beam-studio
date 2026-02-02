const mockPopUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: mockPopUp,
}));

const mockOpenNonstopProgress = jest.fn();
const mockPopById = jest.fn();

jest.mock('@core/app/actions/progress-caller', () => ({
  openNonstopProgress: mockOpenNonstopProgress,
  popById: mockPopById,
}));

const mockAddNewTab = jest.fn();
const mockGetAllTabs = jest.fn();
const mockOffBlurred = jest.fn();
const mockOnBlurred = jest.fn();

jest.mock('@core/app/actions/tabController', () => ({
  addNewTab: mockAddNewTab,
  getAllTabs: mockGetAllTabs,
  offBlurred: mockOffBlurred,
  onBlurred: mockOnBlurred,
}));

const mockOpenFile = jest.fn();

jest.mock('@core/helpers/api/cloudFile', () => ({
  openFile: mockOpenFile,
}));

const mockIsWeb = jest.fn();

jest.mock('@core/helpers/is-web', () => mockIsWeb);

const mockLoadExampleFile = jest.fn();

jest.mock('@core/helpers/menubar/exampleFiles', () => ({
  loadExampleFile: mockLoadExampleFile,
}));

const mockEditor = {
  handleFile: jest.fn(),
};

jest.mock('@core/helpers/svg-editor-helper', () => ({
  getSVGAsync: (callback) =>
    callback({
      Editor: mockEditor,
    }),
}));

const mockSend = jest.fn();

jest.mock('@core/implementations/communicator', () => ({
  send: mockSend,
}));

const mockGetPathForFile = jest.fn();
const mockReadFile = jest.fn();

jest.mock('@core/implementations/fileSystem', () => ({
  getPathForFile: mockGetPathForFile,
  readFile: mockReadFile,
}));

const mockOpenRecentFiles = jest.fn();

jest.mock('@core/implementations/recentMenuUpdater', () => ({
  openRecentFiles: mockOpenRecentFiles,
}));

import { TabEvents } from '@core/app/constants/ipcEvents';
import { checkTabCount, importFileInCurrentTab, setFileInAnotherTab } from '@core/helpers/fileImportHelper';

const mockFiles: any = {
  cloud: { file: { uuid: 'mock-uuid' }, type: 'cloud' },
  example: { key: 'IMPORT_EXAMPLE', type: 'example' },
  normal: {
    data: {
      blob: 'mockFileBlob',
      name: 'File Name',
      path: '/path/to/file',
      type: 'image/svg',
    },
    type: 'normal',
  },
  path: {
    data: {
      name: 'File Name',
      path: '/path/to/file',
      type: 'image/svg',
    },
    type: 'path',
  },
  recent: { filePath: 'mock-recent-path', type: 'recent' },
};

describe('test fileImportHelper', () => {
  describe('checkTabCount', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      mockGetAllTabs.mockReturnValue([{ id: 'tab1' }]);
    });

    test('in web', () => {
      mockIsWeb.mockReturnValue(true);
      expect(checkTabCount()).toBe(true);
      expect(mockGetAllTabs).not.toHaveBeenCalled();
      expect(mockPopUp).not.toHaveBeenCalled();
    });

    test('in desktop', () => {
      expect(checkTabCount()).toBe(true);
      expect(mockGetAllTabs).toHaveBeenCalledTimes(1);
      expect(mockPopUp).not.toHaveBeenCalled();
    });

    test('in desktop and reach limit', () => {
      mockGetAllTabs.mockReturnValue([
        { id: 'tab1' },
        { id: 'tab2' },
        { id: 'tab3' },
        { id: 'tab4' },
        { id: 'tab5' },
        { id: 'tab6' },
        { id: 'tab7' },
      ]);
      expect(checkTabCount()).toBe(false);
      expect(mockGetAllTabs).toHaveBeenCalledTimes(1);
      expect(mockPopUp).toHaveBeenCalledTimes(1);
      expect(mockPopUp).toHaveBeenCalledWith({ message: 'Tab count limit reached' });
    });
  });

  describe('setFileInAnotherTab', () => {
    beforeEach(() => {
      jest.resetAllMocks();
      mockGetAllTabs.mockReturnValue([{ id: 'tab1' }]);
    });

    test('in web', () => {
      mockIsWeb.mockReturnValue(true);
      setFileInAnotherTab(mockFiles.normal);
      expect(window.importingFile).toEqual(mockFiles.normal);
      expect(window.location.hash).toBe('#/studio/beambox');
    });

    test('in desktop', () => {
      setFileInAnotherTab(mockFiles.cloud);
      expect(mockOpenNonstopProgress).toHaveBeenCalledWith({ id: 'import-file-in-another-tab' });
      expect(mockGetPathForFile).not.toHaveBeenCalled();
      expect(mockGetAllTabs).toHaveBeenCalledTimes(2);
      expect(mockOnBlurred).toHaveBeenCalled();
      expect(mockAddNewTab).toHaveBeenCalled();

      mockGetAllTabs.mockReturnValue([{ id: 'tab1' }, { id: 'tab2' }]);
      mockOnBlurred.mock.calls[0][0]();
      expect(mockOffBlurred).toHaveBeenCalled();
      expect(mockPopById).toHaveBeenCalledWith('import-file-in-another-tab');
      expect(mockGetAllTabs).toHaveBeenCalledTimes(3);
      expect(mockSend).toHaveBeenCalledWith(TabEvents.ImportFileInTab, mockFiles.cloud);
    });

    test('in desktop and type is normal', () => {
      mockGetPathForFile.mockReturnValue('/path/to/file');
      setFileInAnotherTab(mockFiles.normal);
      expect(mockOpenNonstopProgress).toHaveBeenCalledWith({ id: 'import-file-in-another-tab' });
      expect(mockGetPathForFile).toHaveBeenCalled();
      expect(mockGetAllTabs).toHaveBeenCalledTimes(2);
      expect(mockOnBlurred).toHaveBeenCalled();
      expect(mockAddNewTab).toHaveBeenCalled();

      mockGetAllTabs.mockReturnValue([{ id: 'tab1' }, { id: 'tab2' }]);
      mockOnBlurred.mock.calls[0][0]();
      expect(mockOffBlurred).toHaveBeenCalled();
      expect(mockPopById).toHaveBeenCalledWith('import-file-in-another-tab');
      expect(mockGetAllTabs).toHaveBeenCalledTimes(3);
      expect(mockSend).toHaveBeenCalledWith(TabEvents.ImportFileInTab, mockFiles.path);
    });
  });

  describe('importFileInCurrentTab', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    test('type is normal', async () => {
      await importFileInCurrentTab(mockFiles.normal);
      expect(mockEditor.handleFile).toHaveBeenCalledWith(mockFiles.normal.data);
    });

    test('type is path', async () => {
      mockReadFile.mockReturnValue('file-content');
      await importFileInCurrentTab(mockFiles.path);
      expect(mockEditor.handleFile).toHaveBeenCalledTimes(1);

      const file = mockEditor.handleFile.mock.calls[0][0];

      expect(file.path).toBe(mockFiles.path.data.path);
      expect(file.name).toBe(mockFiles.path.data.name);
      expect(file.type).toBe(mockFiles.path.data.type);
    });

    test('type is cloud', async () => {
      await importFileInCurrentTab(mockFiles.cloud);
      expect(mockOpenFile).toHaveBeenCalledWith(mockFiles.cloud.file);
    });

    test('type is recent', async () => {
      await importFileInCurrentTab(mockFiles.recent);
      expect(mockOpenRecentFiles).toHaveBeenCalledWith(mockFiles.recent.filePath);
    });

    test('type is example', async () => {
      await importFileInCurrentTab(mockFiles.example);
      expect(mockLoadExampleFile).toHaveBeenCalledWith(mockFiles.example.key);
    });
  });
});
