import React from 'react';

import { render } from '@testing-library/react';

import GridPlaceholder from './GridPlaceholder';

describe('test GridPlaceholder', () => {
  it('should render correctly', () => {
    const { container } = render(<GridPlaceholder hint="mock-hint" placeholder="mock-placeholder" />);

    expect(container).toMatchSnapshot();
  });

  it('should render correctly without hint', () => {
    const { container } = render(<GridPlaceholder placeholder="mock-placeholder" />);

    expect(container).toMatchSnapshot();
  });
});
