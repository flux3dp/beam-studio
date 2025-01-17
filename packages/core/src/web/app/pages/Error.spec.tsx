/* eslint-disable import/first */
import classNames from 'classnames';
import React from 'react';
import { render } from '@testing-library/react';

import Error from './Error';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
jest.mock('app/widgets/Modal', () => ({ className, children }: any) => (
  <div className={classNames(className)}>{children}</div>
));

describe('test Error Page', () => {
  test('should render #/error/screen-size correctly', async () => {
    window.location.hash = '#/error/screen-size';
    const { container } = render(<Error />);
    expect(container).toMatchSnapshot();
  });

  test('should render unknown error correctly', async () => {
    window.location.hash = '#/error/meaningless-string123';
    const { container } = render(<Error />);
    expect(container).toMatchSnapshot();
  });
});
