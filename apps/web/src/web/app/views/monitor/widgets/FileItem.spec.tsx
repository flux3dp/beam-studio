import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';

import { MonitorContext } from 'app/contexts/MonitorContext';

import FileItem from './FileItem';

jest.mock('app/contexts/MonitorContext', () => ({
  MonitorContext: React.createContext(null),
}));

const mockFileInfo = jest.fn();
jest.mock('helpers/device-master', () => ({
  fileInfo: (...args) => mockFileInfo(...args),
}));

const mockOnHighlightItem = jest.fn();
const mockOnSelectFile = jest.fn();
const mockOnDeleteFile = jest.fn();

const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

describe('should render correctly', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
  });

  it('should render correctly', async () => {
    const mockData = ['mock-file', { author: 'flux' }, new Blob(['123'])];
    mockFileInfo.mockResolvedValue(mockData);
    mockCreateObjectURL.mockReturnValue('mock-url');
    const { container, rerender } = render(
      <MonitorContext.Provider value={{
        onHighlightItem: mockOnHighlightItem,
        onSelectFile: mockOnSelectFile,
        onDeleteFile: mockOnDeleteFile,
        highlightedItem: { name: 'file', type: 'FILE' }
      } as any}
      >
        <FileItem path="path" fileName="file" />
      </MonitorContext.Provider>
    );
    await waitFor(() => {
      expect(mockFileInfo).toBeCalledTimes(1);
      expect(mockFileInfo).toHaveBeenLastCalledWith('path', 'file');
      expect(mockCreateObjectURL).toBeCalledTimes(1);
      expect(mockCreateObjectURL).toHaveBeenLastCalledWith(mockData[2]);
    });
    expect(container).toMatchSnapshot();
    expect(container.querySelector('img').getAttribute('src')).toEqual('mock-url');

    rerender(
      <MonitorContext.Provider value={{
        onHighlightItem: mockOnHighlightItem,
        onSelectFile: mockOnSelectFile,
        onDeleteFile: mockOnDeleteFile,
        highlightedItem: { name: 'file2', type: 'FILE' }
      } as any}
      >
        <FileItem path="path2" fileName="file2" />
      </MonitorContext.Provider>
    );

    const mockData2 = ['mock-file', { author: 'flux' }, new Blob(['456'])];
    mockFileInfo.mockResolvedValue(mockData);
    mockCreateObjectURL.mockReturnValue('mock-url2');
    await waitFor(() => {
      expect(mockFileInfo).toBeCalledTimes(2);
      expect(mockFileInfo).toHaveBeenLastCalledWith('path2', 'file2');
      expect(mockCreateObjectURL).toBeCalledTimes(2);
      expect(mockCreateObjectURL).toHaveBeenLastCalledWith(mockData2[2]);
      expect(mockRevokeObjectURL).toBeCalledTimes(1);
      expect(mockRevokeObjectURL).toHaveBeenLastCalledWith('mock-url');
    });
    expect(container).toMatchSnapshot();
    expect(container.querySelector('img').getAttribute('src')).toEqual('mock-url2');
  });

  test('context events should work', async () => {
    const mockData = ['mock-file', { author: 'flux' }, new Blob(['123'])];
    mockFileInfo.mockResolvedValue(mockData);
    mockCreateObjectURL.mockReturnValue('mock-url');
    const { container } = render(
      <MonitorContext.Provider value={{
        onHighlightItem: mockOnHighlightItem,
        onSelectFile: mockOnSelectFile,
        onDeleteFile: mockOnDeleteFile,
        highlightedItem: { name: 'file', type: 'FILE' }
      } as any}
      >
        <FileItem path="path" fileName="file" />
      </MonitorContext.Provider>
    );
    await waitFor(() => {
      expect(mockFileInfo).toBeCalledTimes(1);
      expect(mockFileInfo).toHaveBeenLastCalledWith('path', 'file');
      expect(mockCreateObjectURL).toBeCalledTimes(1);
      expect(mockCreateObjectURL).toHaveBeenLastCalledWith(mockData[2]);
    });

    const divContainer = container.querySelector('.container');
    expect(mockOnHighlightItem).not.toBeCalled();
    fireEvent.click(divContainer);
    expect(mockOnHighlightItem).toBeCalledTimes(1);
    expect(mockOnHighlightItem).toHaveBeenLastCalledWith({ name: 'file', type: 'FILE' });

    expect(mockOnSelectFile).not.toBeCalled();
    fireEvent.doubleClick(divContainer);
    expect(mockOnSelectFile).toBeCalledTimes(1);
    expect(mockOnSelectFile).toHaveBeenLastCalledWith('file', mockData);

    const icon = container.querySelector('i');
    expect(mockOnDeleteFile).not.toBeCalled();
    fireEvent.click(icon);
    expect(mockOnDeleteFile).toBeCalledTimes(1);
  });
});
