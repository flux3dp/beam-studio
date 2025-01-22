import React from 'react';

import { render } from '@testing-library/react';

import MenuItem from './MenuItem';

describe('MenuItem tests', () => {
  test('extends className correctly', () => {
    const className = 'CLASSNAME_PROP';
    const attributes = {
      className: 'CLASSNAME_ATTRIBUTE',
    };

    const { container } = render(<MenuItem attributes={attributes} className={className} />);

    expect(container).toMatchSnapshot();
  });
});
