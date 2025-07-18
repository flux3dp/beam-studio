import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const mockSetFileInAnotherTab = jest.fn();

jest.mock('@core/helpers/fileImportHelper', () => ({
  setFileInAnotherTab: mockSetFileInAnotherTab,
}));

import GridFileLocal from './GridFileLocal';

const mockFile = {
  created_at: '2024-01-09T04:14:36.801586Z',
  last_modified_at: '2024-01-09T06:42:04.824942Z',
  name: 'File name',
  size: 5788,
  thumbnail_url: 'https://s3/url',
  uuid: 'mock-path',
  workarea: 'fhexa1',
};
const mockSetSelectedId = jest.fn();

describe('test GridFileLocal', () => {
  it('should render correctly', () => {
    const { container } = render(<GridFileLocal file={mockFile} selectedId={null} setSelectedId={mockSetSelectedId} />);

    expect(container).toMatchSnapshot();

    const file = container.querySelector('.guide-lines');

    fireEvent.click(file);
    expect(mockSetSelectedId).toHaveBeenCalledWith('mock-path');

    fireEvent.doubleClick(file);
    expect(mockSetFileInAnotherTab).toHaveBeenCalledWith({ filePath: 'mock-path', type: 'recent' });
  });

  it('should render correctly if selected', () => {
    const { container } = render(
      <GridFileLocal file={mockFile} selectedId="mock-path" setSelectedId={mockSetSelectedId} />,
    );

    expect(container).toMatchSnapshot();
  });
});
