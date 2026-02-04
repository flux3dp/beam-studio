import type { IFile } from '@core/interfaces/IMyCloud';

import currentFileManager from './currentFileManager';

const mockUpdateTitle = jest.fn();
const mockTopBarSetUnsavedChange = jest.fn();

jest.mock('@core/app/components/beambox/TopBar/contexts/TopBarController', () => ({
  setHasUnsavedChange: (...args) => mockTopBarSetUnsavedChange(...args),
  updateTitle: () => mockUpdateTitle(),
}));

const mockToggleAutoSave = jest.fn();

jest.mock('@core/helpers/auto-save-helper', () => ({
  toggleAutoSave: (...args) => mockToggleAutoSave(...args),
}));

describe('test currentFileManager', () => {
  beforeEach(() => {
    currentFileManager.clear();
    jest.clearAllMocks();
  });

  it('should set file name', () => {
    currentFileManager.setFileName('test');
    expect(currentFileManager.getName()).toBe('test');
    expect(mockUpdateTitle).toHaveBeenCalledTimes(1);
  });

  it('should set file name extracted from path', () => {
    currentFileManager.setFileName('/some/path/to/test.svg', { extractFromPath: true });
    expect(currentFileManager.getName()).toBe('test');
    expect(mockUpdateTitle).toHaveBeenCalledTimes(1);
  });

  it('should set local file', () => {
    currentFileManager.setLocalFile('/some/path/to/test.svg');
    expect(currentFileManager.getName()).toBe('test');
    expect(currentFileManager.getPath()).toBe('/some/path/to/test.svg');
    expect(currentFileManager.isCloudFile).toBe(false);
    expect(mockUpdateTitle).toHaveBeenCalledTimes(1);
  });

  it('should set cloud file', () => {
    currentFileManager.setCloudFile({ name: 'test', uuid: '123' } as IFile);
    expect(currentFileManager.getName()).toBe('test');
    expect(currentFileManager.getPath()).toBe('123');
    expect(currentFileManager.isCloudFile).toBe(true);
    expect(mockUpdateTitle).toHaveBeenCalledTimes(1);
  });

  it('should set cloud UUID', () => {
    currentFileManager.setCloudUUID('123');
    expect(currentFileManager.getPath()).toBe('123');
    expect(currentFileManager.isCloudFile).toBe(true);
    expect(mockUpdateTitle).toHaveBeenCalledTimes(1);
  });

  it('should clear', () => {
    currentFileManager.setFileName('test');
    expect(mockUpdateTitle).toHaveBeenCalledTimes(1);
    currentFileManager.clear();
    expect(currentFileManager.getName()).toBe(null);
    expect(currentFileManager.getPath()).toBe(null);
    expect(currentFileManager.isCloudFile).toBe(false);
    expect(mockUpdateTitle).toHaveBeenCalledTimes(2);
  });

  test('setHasUnsavedChanges', () => {
    currentFileManager.setHasUnsavedChanges(true);
    expect(currentFileManager.getHasUnsavedChanges()).toBe(true);
    expect(mockTopBarSetUnsavedChange).toHaveBeenCalledTimes(1);
    expect(mockTopBarSetUnsavedChange).toHaveBeenCalledWith(true);
    expect(mockToggleAutoSave).toHaveBeenCalledTimes(1);
    expect(mockToggleAutoSave).toHaveBeenCalledWith(true);
  });
});
