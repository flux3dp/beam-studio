import React from 'react';

import { render } from '@testing-library/react';

import MonitorInfo from './MonitorInfo';

test('should render correctly', () => {
  const { container } = render(<MonitorInfo progress="90%" status="uploading" />);

  expect(container).toMatchSnapshot();
});
