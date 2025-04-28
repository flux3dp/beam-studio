import React from 'react';

import { render } from '@testing-library/react';

import Skeleton from './Skeleton';

describe('test Skeleton', () => {
  it('should render correctly', () => {
    const { container } = render(<Skeleton count={5} />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly without props', () => {
    const { container } = render(<Skeleton />);

    expect(container).toMatchSnapshot();
  });
});
