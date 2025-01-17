/* eslint-disable import/first */
import React from 'react';
import { render } from '@testing-library/react';

import FileName from './FileName';

const mockGetName = jest.fn();
const mockGetIsCloudFile = jest.fn();
jest.mock('app/svgedit/currentFileManager', () => ({
  __esModule: true,
  default: {
    get isCloudFile() {
      return mockGetIsCloudFile();
    },
    getName: () => mockGetName(),
  },
}));

const mockOnTitleChange = jest.fn();
const mockOffTitleChange = jest.fn();
jest.mock('app/views/beambox/TopBar/contexts/TopBarController', () => ({
  onTitleChange: (...args) => mockOnTitleChange(...args),
  offTitleChange: (...args) => mockOffTitleChange(...args),
}));

describe('test FileName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    mockGetIsCloudFile.mockReturnValue(false);
    mockGetName.mockReturnValue('abc');
    const { container, rerender } = render(<FileName hasUnsavedChange />);
    expect(container).toMatchSnapshot();

    mockGetName.mockReturnValue(null);
    rerender(<FileName hasUnsavedChange={false} />);
    expect(container).toMatchSnapshot();

    mockGetName.mockReturnValue(null);
    rerender(<FileName hasUnsavedChange={false} isTitle />);
    expect(container).toMatchSnapshot();
  });

  it('should render correctly with cloud file', () => {
    mockGetIsCloudFile.mockReturnValue(true);
    mockGetName.mockReturnValue('abc');
    const { container, rerender } = render(<FileName hasUnsavedChange />);
    expect(container).toMatchSnapshot();

    mockGetName.mockReturnValue(null);
    rerender(<FileName hasUnsavedChange={false} />);
    expect(container).toMatchSnapshot();

    mockGetName.mockReturnValue(null);
    rerender(<FileName hasUnsavedChange={false} isTitle />);
    expect(container).toMatchSnapshot();
  });
});
