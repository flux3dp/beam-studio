import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import i18n from '@core/helpers/i18n';

const get = jest.fn();
const set = jest.fn();

jest.mock('@core/implementations/storage', () => ({
  get: (...args) => get(...args),
  set: (...args) => set(...args),
}));

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

jest.mock('@core/implementations/browser', () => ({
  open: (...args) => open(...args),
}));

const externalLinkFBSignIn = jest.fn();
const externalLinkGoogleSignIn = jest.fn();
const mockFluxIdEventsOn = jest.fn();
const mockFluxIdEventsOff = jest.fn();
const signIn = jest.fn();
const signOut = jest.fn();

jest.mock('@core/helpers/api/flux-id', () => ({
  externalLinkFBSignIn: (...args) => externalLinkFBSignIn(...args),
  externalLinkGoogleSignIn: (...args) => externalLinkGoogleSignIn(...args),
  fluxIDEvents: {
    off: (...args) => mockFluxIdEventsOff(...args),
    on: (...args) => mockFluxIdEventsOn(...args),
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
    expect(open).toHaveBeenNthCalledWith(1, i18n.lang.flux_id_login.lost_password_url);

    fireEvent.click(getByText('Create Your FLUX Account'));
    expect(open).toHaveBeenCalledTimes(2);
    expect(open).toHaveBeenNthCalledWith(2, i18n.lang.flux_id_login.signup_url);

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
    expect(open).toHaveBeenNthCalledWith(1, i18n.lang.flux_id_login.flux_plus.website_url);
  });
});
