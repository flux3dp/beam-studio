import React from 'react';

import { render, waitFor } from '@testing-library/react';

const socialAuth = jest.fn();

jest.mock('@core/helpers/social-auth', () => socialAuth);

const signInWithGoogleCode = jest.fn();

jest.mock('@core/helpers/api/flux-id', () => ({
  G_REDIRECT_URI: 'https://store.flux3dp.com/beam-studio-oauth?isWeb=true',
  signInWithGoogleCode,
}));

import GoogleOAuth from './GoogleOAuth';

test('should render correctly', async () => {
  signInWithGoogleCode.mockResolvedValue(true);
  window.location.hash =
    '#/google-auth?code=4/0AX4XfWhjY6oc1K0NJKzWnD0FayFqaSqjNMuAjcsCYSopozsP3pZ-ImYrVG_fvBAKnr_y3Q&redirect_url=https://store.flux3dp.com/beam-studio-oauth?isWeb=true';

  const { container } = render(<GoogleOAuth />);

  expect(signInWithGoogleCode).toHaveBeenCalledTimes(1);
  expect(signInWithGoogleCode).toHaveBeenNthCalledWith(1, {
    code: '4/0AX4XfWhjY6oc1K0NJKzWnD0FayFqaSqjNMuAjcsCYSopozsP3pZ-ImYrVG_fvBAKnr_y3Q',
    redirect_url: 'https://store.flux3dp.com/beam-studio-oauth?isWeb=true',
  });
  waitFor(() => {
    expect(socialAuth).toHaveBeenCalledTimes(1);
    expect(socialAuth).toHaveBeenNthCalledWith(1, true);
  });
  expect(container).toMatchSnapshot();
});
