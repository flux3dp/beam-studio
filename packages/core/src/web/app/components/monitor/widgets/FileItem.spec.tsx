import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import { MonitorContext } from '@core/app/contexts/MonitorContext';

import FileItem from './FileItem';

jest.mock('@core/app/contexts/MonitorContext', () => ({
  MonitorContext: React.createContext(null),
}));

const mockFileInfo = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
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
      <MonitorContext
        value={
          {
            highlightedItem: { name: 'file', type: 'FILE' },
            onDeleteFile: mockOnDeleteFile,
            onHighlightItem: mockOnHighlightItem,
            onSelectFile: mockOnSelectFile,
          } as any
        }
      >
        <FileItem fileName="file" path="path" />
      </MonitorContext>,
    );

    await waitFor(() => {
      expect(mockFileInfo).toHaveBeenCalledTimes(1);
      expect(mockFileInfo).toHaveBeenLastCalledWith('path', 'file');
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(mockCreateObjectURL).toHaveBeenLastCalledWith(mockData[2]);
    });
    expect(container).toMatchSnapshot();
    expect(container.querySelector('img').getAttribute('src')).toEqual('mock-url');

    rerender(
      <MonitorContext
        value={
          {
            highlightedItem: { name: 'file2', type: 'FILE' },
            onDeleteFile: mockOnDeleteFile,
            onHighlightItem: mockOnHighlightItem,
            onSelectFile: mockOnSelectFile,
          } as any
        }
      >
        <FileItem fileName="file2" path="path2" />
      </MonitorContext>,
    );

    const mockData2 = ['mock-file', { author: 'flux' }, new Blob(['456'])];

    mockFileInfo.mockResolvedValue(mockData);
    mockCreateObjectURL.mockReturnValue('mock-url2');
    await waitFor(() => {
      expect(mockFileInfo).toHaveBeenCalledTimes(2);
      expect(mockFileInfo).toHaveBeenLastCalledWith('path2', 'file2');
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(2);
      expect(mockCreateObjectURL).toHaveBeenLastCalledWith(mockData2[2]);
      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
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
      <MonitorContext
        value={
          {
            highlightedItem: { name: 'file', type: 'FILE' },
            onDeleteFile: mockOnDeleteFile,
            onHighlightItem: mockOnHighlightItem,
            onSelectFile: mockOnSelectFile,
          } as any
        }
      >
        <FileItem fileName="file" path="path" />
      </MonitorContext>,
    );

    await waitFor(() => {
      expect(mockFileInfo).toHaveBeenCalledTimes(1);
      expect(mockFileInfo).toHaveBeenLastCalledWith('path', 'file');
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      expect(mockCreateObjectURL).toHaveBeenLastCalledWith(mockData[2]);
    });

    const divContainer = container.querySelector('.container');

    expect(mockOnHighlightItem).not.toHaveBeenCalled();
    fireEvent.click(divContainer);
    expect(mockOnHighlightItem).toHaveBeenCalledTimes(1);
    expect(mockOnHighlightItem).toHaveBeenLastCalledWith({ name: 'file', type: 'FILE' });

    expect(mockOnSelectFile).not.toHaveBeenCalled();
    fireEvent.doubleClick(divContainer);
    expect(mockOnSelectFile).toHaveBeenCalledTimes(1);
    expect(mockOnSelectFile).toHaveBeenLastCalledWith('file', mockData);

    const icon = container.querySelector('i');

    expect(mockOnDeleteFile).not.toHaveBeenCalled();
    fireEvent.click(icon);
    expect(mockOnDeleteFile).toHaveBeenCalledTimes(1);
  });
});
