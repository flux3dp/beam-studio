import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';

import FluxCredit from './FluxCredit';

const mockUser = {
  email: 'test123@gmail.com',
  info: {
    credit: 29.5,
    subscription: { is_valid: true, credit: 4.0 },
  },
};

const open = jest.fn();
jest.mock('implementations/browser', () => ({
  open: (...args) => open(...args),
}));

jest.mock('helpers/useI18n', () => () => ({
  topbar: {
    menu: {
      sign_out: 'Sign Out',
    },
  },
  flux_id_login: {
    login_success: 'You’re signed in.',
    email: 'Email',
    flux_plus: {
      explore_plans: 'Explore FLUX+ Plans',
      thank_you: 'Thanks for being a valued member!',
      ai_credit_tooltip: 'For AI background removal',
      flux_credit_tooltip: 'For DMKT designs and AI background removal',
      goto_member_center: 'Go to Member Center',
      member_center_url: 'https://member_center_url',
    },
  },
}));

jest.mock('./FluxPlusModal', () => 'mock-FluxPlusModal');

const getCurrentUser = jest.fn();
const signOut = jest.fn();
jest.mock('helpers/api/flux-id', () => ({
  getCurrentUser: () => getCurrentUser(),
  signOut: (...args) => signOut(...args),
}));

const useIsMobile = jest.fn();
jest.mock('helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

jest.mock('helpers/is-flux-plus-active', () => true);

const onClose = jest.fn();

describe('test FluxCredit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render correctly', () => {
    getCurrentUser.mockReturnValue(mockUser);
    const { container, getByText } = render(<FluxCredit onClose={onClose} />);
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('Go to Member Center'));
    expect(open).toBeCalledTimes(1);
    expect(open).toBeCalledWith('https://member_center_url');

    fireEvent.click(getByText('Sign Out'));
    expect(signOut).toBeCalledTimes(1);
    waitFor(() => expect(onClose).toBeCalledTimes(1));
  });

  test('should render correctly on mobile', () => {
    getCurrentUser.mockReturnValue(mockUser);
    useIsMobile.mockReturnValue(true);
    const { container } = render(<FluxCredit onClose={onClose} />);
    expect(container.querySelector('.content img')).not.toBeInTheDocument();
  });

  test('should render correctly without user detail', () => {
    getCurrentUser.mockReturnValue({ email: 'test123@gmail.com' });
    const { container } = render(<FluxCredit onClose={onClose} />);
    expect(container).toMatchSnapshot();
  });
});
