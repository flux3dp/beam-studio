import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import { MonitorContext } from '@core/app/contexts/MonitorContext';

import MonitorFilelist from './MonitorFilelist';

jest.mock('@core/app/contexts/MonitorContext', () => ({
  MonitorContext: React.createContext(null),
}));

jest.mock('./widgets/Breadcrumbs', () => () => <div>Dummy Breadcrumbs</div>);
jest.mock('./widgets/DirectoryItem', () => ({ name }: { name: string }) => <div className="dir">{name}</div>);
jest.mock('./widgets/FileItem', () => ({ fileName, path }: { fileName: string; path: string }) => (
  <div className="file">
    {path}/{fileName}
  </div>
));

const mockPopUpError = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUpError: (...args) => mockPopUpError(...args),
}));

const mockLs = jest.fn();

jest.mock('@core/helpers/device-master', () => ({
  ls: (...args) => mockLs(...args),
}));

const mockSetShouldUpdateFileList = jest.fn();
const mockUploadFile = jest.fn();

describe('test MonitorFilelist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', async () => {
    mockLs.mockResolvedValueOnce({
      directories: ['da', 'db', 'dc'],
      files: ['fa', 'fb', 'fc'],
    });

    const { container } = render(
      <MonitorContext.Provider value={{ shouldUpdateFileList: false } as any}>
        <MonitorFilelist path="path" />
      </MonitorContext.Provider>,
    );

    await waitFor(() => {
      expect(mockLs).toBeCalledTimes(1);
      expect(mockLs).toHaveBeenLastCalledWith('path');
    });
    expect(container).toMatchSnapshot();
  });

  test('should remove usb folder when path is empty and unable to list USB', async () => {
    mockLs
      .mockResolvedValueOnce({
        directories: ['USB', 'da', 'db', 'dc'],
        files: ['fa', 'fb', 'fc'],
      })
      .mockRejectedValueOnce('error');

    const { container, queryByText } = render(
      <MonitorContext.Provider value={{ shouldUpdateFileList: false } as any}>
        <MonitorFilelist path="" />
      </MonitorContext.Provider>,
    );

    await waitFor(() => {
      expect(mockLs).toBeCalledTimes(2);
      expect(mockLs).toHaveBeenNthCalledWith(1, '');
      expect(mockLs).toHaveBeenNthCalledWith(2, 'USB');
    });
    expect(container).toMatchSnapshot();
    expect(queryByText('USB')).not.toBeInTheDocument();
  });

  test('getContent due to context or path change', async () => {
    mockLs.mockResolvedValueOnce({
      directories: ['da', 'db', 'dc'],
      files: ['fa', 'fb', 'fc'],
    });

    const { getByText, rerender } = render(
      <MonitorContext.Provider value={{ shouldUpdateFileList: false } as any}>
        <MonitorFilelist path="path" />
      </MonitorContext.Provider>,
    );

    await waitFor(() => {
      expect(mockLs).toBeCalledTimes(1);
      expect(mockLs).toHaveBeenLastCalledWith('path');
    });

    mockLs.mockResolvedValueOnce({
      directories: ['de', 'df', 'dg'],
      files: ['fd', 'fe', 'ff'],
    });
    rerender(
      <MonitorContext.Provider value={{ shouldUpdateFileList: false } as any}>
        <MonitorFilelist path="path/fa" />
      </MonitorContext.Provider>,
    );
    await waitFor(() => {
      expect(mockLs).toBeCalledTimes(2);
      expect(mockLs).toHaveBeenLastCalledWith('path/fa');
    });
    expect(getByText('de')).toBeInTheDocument();
    expect(getByText('path/fa/fd')).toBeInTheDocument();

    mockLs.mockResolvedValueOnce({
      directories: ['dh', 'di', 'dj'],
      files: ['fh', 'fi', 'fj'],
    });
    rerender(
      <MonitorContext.Provider
        value={
          {
            setShouldUpdateFileList: mockSetShouldUpdateFileList,
            shouldUpdateFileList: true,
          } as any
        }
      >
        <MonitorFilelist path="path/fa" />
      </MonitorContext.Provider>,
    );
    await waitFor(() => {
      expect(mockLs).toBeCalledTimes(3);
      expect(mockLs).toHaveBeenLastCalledWith('path/fa');
    });
    expect(getByText('dh')).toBeInTheDocument();
    expect(getByText('path/fa/fh')).toBeInTheDocument();
  });

  it('should popUpError when ls get error', async () => {
    mockLs.mockResolvedValueOnce({ error: 'error' });

    const { container } = render(
      <MonitorContext.Provider value={{ shouldUpdateFileList: false } as any}>
        <MonitorFilelist path="path" />
      </MonitorContext.Provider>,
    );

    await waitFor(() => {
      expect(mockLs).toBeCalledTimes(1);
      expect(mockLs).toHaveBeenLastCalledWith('path');
      expect(mockPopUpError).toBeCalledTimes(1);
      expect(mockPopUpError).toHaveBeenLastCalledWith({ id: 'ls error', message: 'error' });
    });
    expect(container).toMatchSnapshot();
  });

  test('drop event should work', async () => {
    mockLs.mockResolvedValueOnce({
      directories: ['da', 'db', 'dc'],
      files: ['fa', 'fb', 'fc'],
    });

    const { container } = render(
      <MonitorContext.Provider value={{ shouldUpdateFileList: false, uploadFile: mockUploadFile } as any}>
        <MonitorFilelist path="path" />
      </MonitorContext.Provider>,
    );

    await waitFor(() => {
      expect(mockLs).toBeCalledTimes(1);
      expect(mockLs).toHaveBeenLastCalledWith('path');
    });

    const mockFile1 = new File(['mock-file-1'], 'mock-file.beam');
    const mockFile2 = new File(['mock-file-2'], 'mock-file.fc');
    const divContainer = container.querySelector('.container');

    fireEvent.drop(divContainer, { dataTransfer: { files: [mockFile1] } });
    expect(mockUploadFile).not.toBeCalled();

    fireEvent.drop(divContainer, { dataTransfer: { files: [mockFile2] } });
    expect(mockUploadFile).toBeCalledTimes(1);
    expect(mockUploadFile).toHaveBeenLastCalledWith(mockFile2);
  });
});
