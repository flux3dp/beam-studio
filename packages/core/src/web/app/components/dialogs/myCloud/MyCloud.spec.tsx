import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import { MyCloudContext } from '@core/app/contexts/MyCloudContext';
import type { IFile } from '@core/interfaces/IMyCloud';

import MyCloud from './MyCloud';

const mockFiles: IFile[] = [
  {
    created_at: '2024-01-09T04:14:36.801586Z',
    last_modified_at: '2024-01-09T06:42:04.824942Z',
    name: 'File name',
    size: 5788,
    thumbnail_url: 'https://s3/url',
    uuid: 'mock-uuid-1111',
    workarea: 'fhexa1',
  },
  {
    created_at: '2024-01-12T08:46:54.904853Z',
    last_modified_at: '2024-01-16T04:11:44.903500Z',
    name: 'Another file',
    size: 5678,
    thumbnail_url: 'https://s3/url2',
    uuid: 'mock-uuid-2222',
    workarea: 'ado1',
  },
];

jest.mock('@core/helpers/useI18n', () => () => ({
  flux_id_login: {
    flux_plus: {
      website_url: 'https://website_url',
    },
  },
  my_cloud: {
    file_limit: 'Free file',
    loading_file: 'Loading...',
    no_file_subtitle: 'Go to Menu > "File" > "Save to Cloud"',
    no_file_title: 'Save files to My Cloud to get started.',
    title: 'My Cloud',
    upgrade: 'Upgrade',
  },
}));

const mockUser = {
  email: 'test123@gmail.com',
  info: {
    subscription: {
      is_valid: false,
    },
  },
};

const getCurrentUser = jest.fn();

jest.mock('@core/helpers/api/flux-id', () => ({
  getCurrentUser: () => getCurrentUser(),
}));

const open = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: (...args) => open(...args),
}));

jest.mock('@core/app/contexts/MyCloudContext', () => ({
  MyCloudContext: React.createContext({}),
  MyCloudProvider: ({ children, onClose }: any) => (
    <MyCloudContext.Provider value={{ files: mockFiles, onClose } as any}>{children}</MyCloudContext.Provider>
  ),
}));

const mockUseIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

jest.mock('@core/helpers/is-flux-plus-active', () => true);

jest.mock('./GridFile', () => ({ file }: any) => <div>Mock Grid File: {JSON.stringify(file)}</div>);
jest.mock('./Head', () => 'mock-head');

const mockOnClose = jest.fn();

describe('test MyCloud', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should rendered correctly', () => {
    getCurrentUser.mockReturnValue(mockUser);

    const { baseElement, getByText } = render(<MyCloud onClose={mockOnClose} />);

    expect(baseElement).toMatchSnapshot();
    fireEvent.click(getByText('Upgrade'));
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith('https://website_url');

    const closeButton = baseElement.querySelector('.ant-modal-close');

    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('should rendered correctly when user is subscribed', () => {
    getCurrentUser.mockReturnValue({
      email: 'test123@gmail.com',
      info: {
        subscription: {
          is_valid: true,
        },
      },
    });

    const { baseElement } = render(<MyCloud onClose={mockOnClose} />);

    expect(baseElement).toMatchSnapshot();
  });

  test('should rendered correctly in mobile', () => {
    getCurrentUser.mockReturnValue(mockUser);
    mockUseIsMobile.mockReturnValue(true);

    const { container } = render(<MyCloud onClose={mockOnClose} />);

    expect(container).toMatchSnapshot();

    const button = container.querySelector('.close-icon');

    fireEvent.click(button);
    waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
  });
});
