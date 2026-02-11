import React from 'react';

import { render } from '@testing-library/react';

import { MyCloudContext } from '@core/app/contexts/MyCloudContext';

const mockContext: any = { value: {} };

jest.mock('@core/app/contexts/MyCloudContext', () => ({
  MyCloudContext: React.createContext({}),
  MyCloudProvider: ({ children }) => <MyCloudContext value={mockContext.value}>{children}</MyCloudContext>,
}));

jest.mock('@core/app/components/dialogs/myCloud/GridFile', () => 'mock-grid-file');
jest.mock('@core/app/components/welcome/GridPlaceholder', () => 'mock-grid-placeholder');

import TabMyCloud from './TabMyCloud';

const mockUser = { email: '' };

describe('test TabMyCloud', () => {
  beforeEach(() => {
    mockContext.value = {};
  });

  it('should render correctly', () => {
    mockContext.value.files = [{}, {}];

    const { container } = render(<TabMyCloud user={mockUser} />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when not login', () => {
    const { container } = render(<TabMyCloud user={null} />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when loading', () => {
    const { container } = render(<TabMyCloud user={mockUser} />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when no saved files', () => {
    mockContext.value.files = [];

    const { container } = render(<TabMyCloud user={mockUser} />);

    expect(container).toMatchSnapshot();
  });
});
