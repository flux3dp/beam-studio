import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import FluxPlusWarning from './FluxPlusWarning';

const showLoginDialog = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  showLoginDialog: () => showLoginDialog(),
}));

const open = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: (...args) => open(...args),
}));

jest.mock('@core/helpers/useI18n', () => () => ({
  flux_id_login: {
    flux_plus: {
      access_monotype_feature: 'You do not have Monotype Fonts Add-on.',
      access_monotype_feature_note:
        'You must have FLUX+ Pro membership or Monotype Fonts Add-on to access this feature.',
      access_plus_feature_1: 'You are accessing a',
      access_plus_feature_2: 'feature.',
      access_plus_feature_note: 'You must have FLUX+ membership to access this feature.',
      get_addon: 'Get Add-on',
      goto_member_center: 'Go to Member Center',
      member_center_url: 'https://member_center_url',
      subscribe_now: 'Subscribe now',
    },
    login: 'Sign In',
  },
}));

const getCurrentUser = jest.fn();

jest.mock('@core/helpers/api/flux-id', () => ({
  getCurrentUser: () => getCurrentUser(),
}));

const onClose = jest.fn();

jest.mock('./FluxPlusModal', () => 'mock-FluxPlusModal');

describe('test FluxPlusWarning', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render correctly', () => {
    const { container, getByText } = render(<FluxPlusWarning onClose={onClose} />);

    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('Subscribe now'));
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith('https://member_center_url');

    fireEvent.click(getByText('Sign In'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(showLoginDialog).toHaveBeenCalledTimes(1);
  });

  test('access monotype feature', () => {
    const { container, getByText } = render(<FluxPlusWarning monotype onClose={onClose} />);

    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('Get Add-on'));
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith('https://member_center_url');

    fireEvent.click(getByText('Sign In'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(showLoginDialog).toHaveBeenCalledTimes(1);
  });

  test('with user', () => {
    getCurrentUser.mockReturnValue({ email: 'test123@gmail.com' });

    const { container } = render(<FluxPlusWarning onClose={onClose} />);

    expect(container).toMatchSnapshot();
  });
});
