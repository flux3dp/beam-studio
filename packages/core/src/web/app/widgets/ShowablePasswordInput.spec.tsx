import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import ShowablePasswordInput from './ShowablePasswordInput';

describe('test ShowablePasswordInput', () => {
  test('should render correctly', () => {
    const { container } = render(
      <ShowablePasswordInput id="password-input" placeholder="Password" />
    );
    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('img'));
    expect(container).toMatchSnapshot();
  });
});
