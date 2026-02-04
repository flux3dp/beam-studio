import React from 'react';

import { render } from '@testing-library/react';

import FileName from './index';

const mockGetName = jest.fn();
const mockGetIsCloudFile = jest.fn();

jest.mock('@core/app/svgedit/currentFileManager', () => ({
  __esModule: true,
  default: {
    getName: () => mockGetName(),
    get isCloudFile() {
      return mockGetIsCloudFile();
    },
  },
}));

const mockOnTitleChange = jest.fn();
const mockOffTitleChange = jest.fn();

jest.mock('../contexts/TopBarController', () => ({
  offTitleChange: (...args) => mockOffTitleChange(...args),
  onTitleChange: (...args) => mockOnTitleChange(...args),
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
