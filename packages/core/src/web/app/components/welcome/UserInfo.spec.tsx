import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { useScreenStore } from '@core/app/stores/screenStore';

const mockShowLoginDialog = jest.fn();
const mockShowFluxCreditDialog = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  showFluxCreditDialog: mockShowFluxCreditDialog,
  showLoginDialog: mockShowLoginDialog,
}));

const mockSignOut = jest.fn();

jest.mock('@core/helpers/api/flux-id', () => ({
  signOut: mockSignOut,
}));

const mockOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: mockOpen,
}));

const mockUser = {
  email: 'mock-email',
  info: { avatar: 'mock-avatar', nickname: 'mock-nickname' },
};

import UserInfo from './UserInfo';

describe('test UserInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useScreenStore.setState({ isMobile: false });
  });

  it('should render correctly', () => {
    const { container, getByText } = render(<UserInfo user={mockUser} />);

    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('Member Center'));
    expect(mockOpen).toHaveBeenCalledWith('https://member.flux3dp.com/en-US/machine-register');

    fireEvent.click(getByText('mock-nickname'));
    expect(mockShowFluxCreditDialog).toHaveBeenCalled();
  });

  it('should render correctly in mobile', () => {
    useScreenStore.setState({ isMobile: true });

    const { container } = render(<UserInfo user={mockUser} />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly when not login', () => {
    const { container, getByText } = render(<UserInfo user={null} />);

    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('Log in or Sign Up'));
    expect(mockShowLoginDialog).toHaveBeenCalled();
  });
});
