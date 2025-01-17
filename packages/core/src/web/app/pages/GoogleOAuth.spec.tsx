/* eslint-disable import/first */
import React from 'react';
import { render, waitFor } from '@testing-library/react';

const socialAuth = jest.fn();
jest.mock('helpers/social-auth', () => socialAuth);

const signInWithGoogleCode = jest.fn();
jest.mock('helpers/api/flux-id', () => ({
  signInWithGoogleCode,
  G_REDIRECT_URI: 'https://store.flux3dp.com/beam-studio-oauth?isWeb=true',
}));

import GoogleOAuth from './GoogleOAuth';

test('should render correctly', async () => {
  signInWithGoogleCode.mockResolvedValue(true);
  window.location.hash =
    // eslint-disable-next-line max-len
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
