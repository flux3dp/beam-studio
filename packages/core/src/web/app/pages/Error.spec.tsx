import React from 'react';

import { render } from '@testing-library/react';
import classNames from 'classnames';

import Error from './Error';

jest.mock('@core/app/widgets/Modal', () => ({ children, className }: any) => (
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
