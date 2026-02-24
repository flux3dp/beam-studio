import React from 'react';

import { render, waitFor } from '@testing-library/react';

const mockFetch = jest.fn().mockResolvedValue({ blob: async () => 'mockBlob' });

jest.spyOn(global, 'fetch').mockImplementation(mockFetch);

const mockOnFocused = jest.fn();
const mockOffFocused = jest.fn();

jest.mock('@core/app/actions/tabController', () => ({
  offFocused: mockOffFocused,
  onFocused: mockOnFocused,
}));

jest.mock('@core/app/svgedit/currentFileManager', () => ({
  extractFileName: (filePath: string) => filePath,
}));

const mockReadBeamFileInfo = jest.fn().mockResolvedValue({ thumbnail: 'mockThumbnail', workarea: 'fbm2' });

jest.mock('@core/helpers/beam-file-helper', () => ({
  readBeamFileInfo: mockReadBeamFileInfo,
}));

const mockCommunicator = {};

jest.mock('@core/implementations/communicator', () => ({
  off: jest.fn(),
  on: (event, handler) => {
    mockCommunicator[event] = handler;
  },
}));

const mockExists = jest.fn().mockReturnValue(true);
const mockStatSync = jest.fn().mockReturnValue({ mtime: '', size: 0 });

jest.mock('@core/implementations/fileSystem', () => ({
  exists: mockExists,
  statSync: mockStatSync,
}));

const mockGet = jest.fn();

jest.mock('@core/implementations/storage', () => ({
  get: mockGet,
}));

jest.mock('@core/app/components/welcome/GridFileLocal', () => 'mock-grid-file');
jest.mock('@core/app/components/welcome/GridNew', () => 'mock-grid-new');

import TabRecentFiles from './TabRecentFiles';
import { TabEvents } from '@core/app/constants/ipcEvents';

describe('test TabRecentFiles', () => {
  it('should render correctly', async () => {
    mockGet.mockReturnValue(['file1.beam', 'file2.beam']);

    const { container } = render(<TabRecentFiles />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenNthCalledWith(1, 'file1.beam');
      expect(mockFetch).toHaveBeenNthCalledWith(2, 'file2.beam');
    });

    await waitFor(() => {
      expect(container.querySelectorAll('mock-grid-file')).toHaveLength(2);
    });
    expect(container).toMatchSnapshot();

    mockGet.mockReturnValue(['file3.beam']);
    mockOnFocused.mock.calls[0][0]();
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    mockCommunicator[TabEvents.UpdateRecentFiles]({});
    mockOnFocused.mock.calls[0][0]();
    await waitFor(() => {
      expect(mockFetch).toHaveBeenNthCalledWith(3, 'file3.beam');
    });
    await waitFor(() => {
      expect(container.querySelectorAll('mock-grid-file')).toHaveLength(1);
    });
  });
});
