import React from 'react';
import { render } from '@testing-library/react';

import MonitorInfo from './MonitorInfo';

test('should render correctly', () => {
  const { container } = render(<MonitorInfo status="uploading" progress="90%" />);
  expect(container).toMatchSnapshot();
});
