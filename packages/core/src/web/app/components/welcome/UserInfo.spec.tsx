import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const mockShowLoginDialog = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  showLoginDialog: mockShowLoginDialog,
}));

const mockSignOut = jest.fn();

jest.mock('@core/helpers/api/flux-id', () => ({
  signOut: mockSignOut,
}));

const mockUseIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: mockUseIsMobile,
}));

const mockOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: mockOpen,
}));

import UserInfo from './UserInfo';

const mockUser = {
  email: 'mock-email',
  info: { avatar: 'mock-avatar', nickname: 'mock-nickname' },
};

describe('test UserInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container, getByText } = render(<UserInfo user={mockUser} />);

    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('Sign Out'));
    expect(mockSignOut).toHaveBeenCalled();

    fireEvent.click(getByText('Member Center'));
    expect(mockOpen).toHaveBeenCalledWith('https://member.flux3dp.com/en-US/machine-register');
  });

  it('should render correctly in mobile', () => {
    mockUseIsMobile.mockReturnValue(true);

    const { container } = render(<UserInfo user={mockUser} />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when not login', () => {
    const { container, getByText } = render(<UserInfo user={null} />);

    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('Sign In'));
    expect(mockShowLoginDialog).toHaveBeenCalled();
  });
});
