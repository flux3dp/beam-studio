import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import FluxPlusWarning from './FluxPlusWarning';

const showLoginDialog = jest.fn();
jest.mock('app/actions/dialog-caller', () => ({
  showLoginDialog: () => showLoginDialog(),
}));

const open = jest.fn();
jest.mock('implementations/browser', () => ({
  open: (...args) => open(...args),
}));

jest.mock('helpers/useI18n', () => () => ({
  flux_id_login: {
    login: 'Sign In',
    flux_plus: {
      goto_member_center: 'Go to Member Center',
      access_plus_feature_1: 'You are accessing a',
      access_plus_feature_2: 'feature.',
      access_plus_feature_note: 'You must have FLUX+ membership to access this feature.',
      access_monotype_feature: 'You do not have Monotype Fonts Add-on.',
      access_monotype_feature_note:
        'You must have FLUX+ Pro membership or Monotype Fonts Add-on to access this feature.',
      get_addon: 'Get Add-on',
      subscribe_now: 'Subscribe now',
      member_center_url: 'https://member_center_url',
    },
  },
}));

const getCurrentUser = jest.fn();
jest.mock('helpers/api/flux-id', () => ({
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
    expect(open).toBeCalledTimes(1);
    expect(open).toBeCalledWith('https://member_center_url');

    fireEvent.click(getByText('Sign In'));
    expect(onClose).toBeCalledTimes(1);
    expect(showLoginDialog).toBeCalledTimes(1);
  });

  test('access monotype feature', () => {
    const { container, getByText } = render(<FluxPlusWarning onClose={onClose} monotype />);
    expect(container).toMatchSnapshot();

    fireEvent.click(getByText('Get Add-on'));
    expect(open).toBeCalledTimes(1);
    expect(open).toBeCalledWith('https://member_center_url');

    fireEvent.click(getByText('Sign In'));
    expect(onClose).toBeCalledTimes(1);
    expect(showLoginDialog).toBeCalledTimes(1);
  });

  test('with user', () => {
    getCurrentUser.mockReturnValue({ email: 'test123@gmail.com' });
    const { container } = render(<FluxPlusWarning onClose={onClose} />);
    expect(container).toMatchSnapshot();
  });
});
