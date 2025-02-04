import React from 'react';

import { act, fireEvent, render } from '@testing-library/react';

const mockShowOpenDialog = jest.fn();

jest.mock('@core/implementations/dialog', () => ({
  showOpenDialog: mockShowOpenDialog,
}));

const mockExists = jest.fn();
const mockIsFile = jest.fn();
const mockIsDirectory = jest.fn();

jest.mock('@core/implementations/fileSystem', () => ({
  exists: mockExists,
  isDirectory: mockIsDirectory,
  isFile: mockIsFile,
}));

import PathInput from './PathInput';

describe('test PathInput', () => {
  test('should render correctly', async () => {
    const mockGetValue = jest.fn();
    const { container } = render(
      <PathInput
        buttonTitle="Choose Folder"
        className="with-error"
        defaultValue="defaultFolder"
        forceValidValue={false}
        getValue={mockGetValue}
        type={1}
      />,
    );

    expect(container).toMatchSnapshot();
    mockShowOpenDialog.mockResolvedValue({
      canceled: true,
      filePaths: [],
    });
    await act(async () => {
      fireEvent.click(container.querySelector('.btn'));
    });
    expect(mockShowOpenDialog).toHaveBeenCalledTimes(1);
    expect(mockShowOpenDialog).toHaveBeenNthCalledWith(1, {
      defaultPath: 'defaultFolder',
      properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
    });
    expect(mockGetValue).not.toHaveBeenCalled();
    expect(container).toMatchSnapshot();

    mockShowOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ['myDocuments'],
    });
    mockExists.mockReturnValue(false);
    await act(async () => {
      fireEvent.click(container.querySelector('.btn'));
    });
    expect(mockShowOpenDialog).toHaveBeenCalledTimes(2);
    expect(mockShowOpenDialog).toHaveBeenNthCalledWith(2, {
      defaultPath: 'defaultFolder',
      properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
    });
    expect(mockExists).toHaveBeenCalledTimes(1);
    expect(mockExists).toHaveBeenNthCalledWith(1, 'myDocuments');
    expect(mockGetValue).toHaveBeenCalledTimes(1);
    expect(mockGetValue).toHaveBeenNthCalledWith(1, 'myDocuments', false);
    expect(container).toMatchSnapshot();
  });
});
