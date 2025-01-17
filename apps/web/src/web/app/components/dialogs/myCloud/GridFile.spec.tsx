import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { IFile } from 'interfaces/IMyCloud';
import { MyCloudContext } from 'app/contexts/MyCloudContext';

import GridFile from './GridFile';

jest.mock('helpers/useI18n', () => () => ({
  my_cloud: {
    action: {
      open: 'Open',
      rename: 'Rename',
      duplicate: 'Duplicate',
      download: 'Download',
      delete: 'Delete',
      confirmFileDelete: 'Are you sure you want to delete this file?',
    },
  },
}));

const mockFile: IFile = {
  uuid: 'mock-uuid',
  name: 'File name',
  size: 5788,
  thumbnail_url: 'https://s3/url',
  workarea: 'fhexa1',
  created_at: '2024-01-09T04:14:36.801586Z',
  last_modified_at: '2024-01-09T06:42:04.824942Z',
};

const mockOpen = jest.fn();
const mockDuplicate = jest.fn();
const mockDownload = jest.fn();
const mockRename = jest.fn();
const mockDelete = jest.fn();
const mockSetEditingId = jest.fn();
const mockSetSelectedId = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockContext: any = {
  fileOperation: {
    open: mockOpen,
    duplicate: mockDuplicate,
    download: mockDownload,
    rename: mockRename,
    delete: mockDelete,
  },
  editingId: null,
  setEditingId: mockSetEditingId,
  selectedId: null,
  setSelectedId: mockSetSelectedId,
};

jest.mock('app/contexts/MyCloudContext', () => ({
  MyCloudContext: React.createContext(null),
}));

const mockUseIsMobile = jest.fn();
jest.mock('helpers/system-helper', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

describe('test GridFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should behave correctly', () => {
    const { container, getByText, rerender } = render(
      <MyCloudContext.Provider value={mockContext}>
        <GridFile file={mockFile} />
      </MyCloudContext.Provider>
    );
    expect(container).toMatchSnapshot();

    const previewImg = container.querySelector('.guide-lines');
    fireEvent.click(previewImg);
    expect(mockSetSelectedId).toBeCalledTimes(1);
    expect(mockSetSelectedId).toHaveBeenNthCalledWith(1, 'mock-uuid');
    fireEvent.doubleClick(previewImg);
    expect(mockOpen).toBeCalledTimes(1);
    expect(mockOpen).toHaveBeenNthCalledWith(1, mockFile);

    let dropdown = container.querySelector('.ant-dropdown');
    expect(dropdown).not.toBeInTheDocument();

    fireEvent.click(container.querySelector('.trigger'));
    dropdown = container.querySelector('.ant-dropdown');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).toHaveClass('overlay');
    expect(dropdown).not.toHaveClass('ant-dropdown-hidden');
    expect(container).toMatchSnapshot();
    expect(mockSetSelectedId).toBeCalledTimes(2);
    expect(mockSetSelectedId).toHaveBeenNthCalledWith(2, 'mock-uuid');

    fireEvent.click(getByText('Open'));
    expect(dropdown).toHaveClass('ant-dropdown-hidden');
    expect(mockOpen).toBeCalledTimes(2);
    expect(mockOpen).toHaveBeenNthCalledWith(2, mockFile);

    fireEvent.click(getByText('Rename'));
    expect(mockSetEditingId).toBeCalledTimes(1);
    expect(mockSetEditingId).toBeCalledWith('mock-uuid');
    rerender(
      <MyCloudContext.Provider value={{ ...mockContext, editingId: 'mock-uuid' }}>
        <GridFile file={mockFile} />
      </MyCloudContext.Provider>
    );
    const input = container.querySelector('.edit');
    expect(input).toBeInTheDocument();
    expect(container).toMatchSnapshot();
    fireEvent.change(input, { target: { value: 'new name' } });
    fireEvent.blur(input);
    expect(mockRename).toBeCalledTimes(1);
    expect(mockRename).toBeCalledWith(mockFile, 'new name');

    rerender(
      <MyCloudContext.Provider value={mockContext}>
        <GridFile file={mockFile} />
      </MyCloudContext.Provider>
    );

    fireEvent.click(getByText('Duplicate'));
    expect(mockDuplicate).toBeCalledTimes(1);
    expect(mockDuplicate).toBeCalledWith(mockFile);

    fireEvent.click(getByText('Download'));
    expect(mockDownload).toBeCalledTimes(1);
    expect(mockDownload).toBeCalledWith(mockFile);

    fireEvent.click(getByText('Delete'));
    const confirm = container.querySelector('.ant-popconfirm');
    expect(confirm).toBeInTheDocument();
    expect(container).toMatchSnapshot();
    fireEvent.click(getByText('OK'));
    expect(mockDelete).toBeCalledTimes(1);
    expect(mockDelete).toBeCalledWith(mockFile);
  });

  test('should rendered correctly in mobile', () => {
    mockUseIsMobile.mockReturnValue(true);
    const { container } = render(
      <MyCloudContext.Provider value={mockContext}>
        <GridFile file={mockFile} />
      </MyCloudContext.Provider>
    );
    expect(container).toMatchSnapshot();

    const previewImg = container.querySelector('.guide-lines');
    fireEvent.click(previewImg);
    expect(mockSetSelectedId).toBeCalledTimes(1);
    expect(mockSetSelectedId).toHaveBeenNthCalledWith(1, 'mock-uuid');
    const dropdown = container.querySelector('.ant-dropdown');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).not.toHaveClass('ant-dropdown-hidden');
    fireEvent.doubleClick(previewImg);
    expect(mockOpen).not.toBeCalled();
  });
});
