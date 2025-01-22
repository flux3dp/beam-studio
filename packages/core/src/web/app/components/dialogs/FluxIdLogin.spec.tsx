import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import FluxIdLogin from './FluxIdLogin';

const popUpError = jest.fn();
const popUp = jest.fn();

jest.mock('@core/app/actions/alert-caller', () => ({
  popUp: (...args) => popUp(...args),
  popUpError: (...args) => popUpError(...args),
}));

const showFluxCreditDialog = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  showFluxCreditDialog: () => showFluxCreditDialog(),
}));

const open = jest.fn();

jest.mock('@app/implementations/browser', () => ({
  open: (...args) => open(...args),
}));

jest.mock('@core/helpers/useI18n', () => () => ({
  flux_id_login: {
    connection_fail: '#847 Failed to connect to FLUX member service.',
    email: 'Email',
    flux_plus: {
      explore_plans: 'Explore FLUX+ Plans',
      website_url: 'https://website_url',
    },
    forget_password: 'Forgot Password?',
    incorrect: 'Email address or password is not correct.',
    login: 'Sign In',
    login_success: 'Successfully logged in.',
    lost_password_url: 'lost_password_url',
    new_to_flux: 'New to FLUX? Create an account.',
    not_verified: 'The email address has not been verified yet.',
    offline: 'Work Offline',
    password: 'Password',
    register: 'Create Your FLUX Account',
    remember_me: 'Remember me',
    signup_url: 'signup_url',
    work_offline: 'Work Offline',
  },
}));

const get = jest.fn();
const set = jest.fn();

jest.mock('@app/implementations/storage', () => ({
  get: (...args) => get(...args),
  set: (...args) => set(...args),
}));

const externalLinkFBSignIn = jest.fn();
const externalLinkGoogleSignIn = jest.fn();
const mockFluxIdEventsOn = jest.fn();
const mockRemoveListener = jest.fn();
const signIn = jest.fn();
const signOut = jest.fn();

jest.mock('@core/helpers/api/flux-id', () => ({
  externalLinkFBSignIn: (...args) => externalLinkFBSignIn(...args),
  externalLinkGoogleSignIn: (...args) => externalLinkGoogleSignIn(...args),
  fluxIDEvents: {
    on: (...args) => mockFluxIdEventsOn(...args),
    removeListener: (...args) => mockRemoveListener(...args),
  },
  signIn: (...args) => signIn(...args),
  signOut: (...args) => signOut(...args),
}));

const useIsMobile = jest.fn();

jest.mock('@core/helpers/system-helper', () => ({
  useIsMobile: () => useIsMobile(),
}));

jest.mock('./FluxPlusModal', () => 'mock-FluxPlusModal');

jest.mock('@core/helpers/is-flux-plus-active', () => true);

describe('should render correctly', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('desktop version', async () => {
    get.mockReturnValue(false);

    const onClose = jest.fn();
    const { baseElement, getByText } = render(<FluxIdLogin onClose={onClose} silent={false} />);

    expect(baseElement).toMatchSnapshot();
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenNthCalledWith(1, 'keep-flux-id-login');

    fireEvent.click(baseElement.querySelector('div.facebook'));
    expect(externalLinkFBSignIn).toHaveBeenCalledTimes(1);

    fireEvent.click(baseElement.querySelector('div.google'));
    expect(externalLinkGoogleSignIn).toHaveBeenCalledTimes(1);

    fireEvent.click(baseElement.querySelector('div.remember-me'));
    expect(baseElement).toMatchSnapshot();

    fireEvent.click(baseElement.querySelector('div.forget-password'));
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenNthCalledWith(1, 'lost_password_url');

    fireEvent.click(getByText('Create Your FLUX Account'));
    expect(open).toHaveBeenCalledTimes(2);
    expect(open).toHaveBeenNthCalledWith(2, 'signup_url');

    fireEvent.click(getByText('Work Offline'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('web version', () => {
    window.FLUX.version = 'web';

    const onClose = jest.fn();
    const { baseElement } = render(<FluxIdLogin onClose={onClose} silent={false} />);

    expect(baseElement).toMatchSnapshot();
  });

  test('mobile version', () => {
    const onClose = jest.fn();

    useIsMobile.mockReturnValue(true);

    const { baseElement, getByText } = render(<FluxIdLogin onClose={onClose} silent={false} />);

    expect(baseElement).toMatchSnapshot();

    fireEvent.click(getByText('Explore FLUX+ Plans'));
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenNthCalledWith(1, 'https://website_url');
  });
});
