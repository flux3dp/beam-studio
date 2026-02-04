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

jest.mock('@core/implementations/browser', () => ({
  open: (...args) => open(...args),
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
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith('https://member.flux3dp.com/en-US/subscription');

    fireEvent.click(getByText('Log out'));
    expect(signOut).toHaveBeenCalledTimes(1);
    waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
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
