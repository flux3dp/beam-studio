import React from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

import FluxCredit from './FluxCredit';

const mockUser = {
  email: 'test123@gmail.com',
  info: {
    credit: 29.5,
    subscription: { credit: 4.0, is_valid: true },
  },
};

const open = jest.fn();

jest.mock('@app/implementations/browser', () => ({
  open: (...args) => open(...args),
}));

jest.mock('@core/helpers/useI18n', () => () => ({
  flux_id_login: {
    email: 'Email',
    flux_plus: {
      ai_credit_tooltip: 'For AI background removal',
      explore_plans: 'Explore FLUX+ Plans',
      flux_credit_tooltip: 'For DMKT designs and AI background removal',
      goto_member_center: 'Go to Member Center',
      member_center_url: 'https://member_center_url',
      thank_you: 'Thanks for being a valued member!',
    },
    login_success: 'You’re signed in.',
  },
  topbar: {
    menu: {
      sign_out: 'Sign Out',
    },
  },
}));

jest.mock('./FluxPlusModal', () => 'mock-FluxPlusModal');

const getCurrentUser = jest.fn();
const signOut = jest.fn();

jest.mock('@core/helpers/api/flux-id', () => ({
  getCurrentUser: () => getCurrentUser(),
  signOut: (...args) => signOut(...args),
}));

const useIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

jest.mock('@core/helpers/is-flux-plus-active', () => true);

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
