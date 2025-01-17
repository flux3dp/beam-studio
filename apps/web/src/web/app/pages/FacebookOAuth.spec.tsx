/* eslint-disable max-len */
/* eslint-disable import/first */
import React from 'react';
import { render, waitFor } from '@testing-library/react';

const socialAuth = jest.fn();
jest.mock('helpers/social-auth', () => socialAuth);

const signInWithFBToken = jest.fn();
jest.mock('helpers/api/flux-id', () => ({
  signInWithFBToken,
}));

import FacebookOAuth from './FacebookOAuth';

test('should render correctly', async () => {
  signInWithFBToken.mockResolvedValue(true);
  window.location.hash =
    '#/fb-auth#access_token=EAAPOjTRHtNEBANu7wd4I0TcHKDAX3C5QzFnfssNZBqTXEbn2Qnp6BBQMSIBXZB5lkhdC4ZAijms9tHGqiT9ZC8DmdabWCxGTF6eUmzy6io1soXkI2monscrdJ68W9av6YEwAadLF1QqxfDPiBJnVXAlwz3oZAet1j51LZBzEm1dZBCWbZCXASCdrsr4wq28jpyUMG4LEy9T0GqZAGCp4DZAYWLz4roZA8ZCdY3MZD&data_access_expiration_time=1636277403&expires_in=5397&long_lived_token=EAAPOjTRHtNEBAHN6aTwNsUM1eHB0gsIZAJPOsguvkxtTQFfQ06aA7jECzHASYqCH4QS4ckld5m4Q5vQ6k6a6JdZATSVbXS8dECDwyVBYGL6Rz5dEC3hOoITr8zIT67xvjd20aIeXHEvMOeIPdkZAEFw3TfAtRwplJAKrkja0nNWPsRLMG4kqUrg2mQm4iQZD';
  const { container } = render(<FacebookOAuth />);

  expect(signInWithFBToken).toHaveBeenCalledTimes(1);
  expect(signInWithFBToken).toHaveBeenNthCalledWith(
    1,
    'EAAPOjTRHtNEBANu7wd4I0TcHKDAX3C5QzFnfssNZBqTXEbn2Qnp6BBQMSIBXZB5lkhdC4ZAijms9tHGqiT9ZC8DmdabWCxGTF6eUmzy6io1soXkI2monscrdJ68W9av6YEwAadLF1QqxfDPiBJnVXAlwz3oZAet1j51LZBzEm1dZBCWbZCXASCdrsr4wq28jpyUMG4LEy9T0GqZAGCp4DZAYWLz4roZA8ZCdY3MZD'
  );
  waitFor(() => {
    expect(socialAuth).toHaveBeenCalledTimes(1);
    expect(socialAuth).toHaveBeenNthCalledWith(1, true);
  });
  expect(container).toMatchSnapshot();
});
