import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import UserAvatar from './UserAvatar';

const showFluxCreditDialog = jest.fn();

jest.mock('@core/app/actions/dialog-caller', () => ({
  showFluxCreditDialog: () => showFluxCreditDialog(),
}));

describe('test UserAvatar', () => {
  test('no user', () => {
    const { container } = render(<UserAvatar user={null} />);

    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('.user-avatar'));
    expect(showFluxCreditDialog).toBeCalledTimes(1);
  });

  test('with user avatar', () => {
    const { container } = render(
      <UserAvatar
        user={{
          email: '123@test.com',
          info: { avatar: 'mock-avatar-src' },
        }}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  test('with subscription', () => {
    const { container } = render(
      <UserAvatar
        user={{
          email: '123@test.com',
          info: { subscription: { is_valid: true } },
        }}
      />,
    );

    expect(container).toMatchSnapshot();
  });
});
