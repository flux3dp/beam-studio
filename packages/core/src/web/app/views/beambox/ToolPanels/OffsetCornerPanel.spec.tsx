/* eslint-disable import/first */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

jest.mock('helpers/i18n', () => ({
  lang: {
    beambox: {
      tool_panels: {
        _offset: {
          corner_type: 'Corner',
          sharp: 'Sharp',
          round: 'Round',
        },
      },
    },
  },
}));

import OffsetCornerPanel from './OffsetCornerPanel';

test('should render correctly', () => {
  const onValueChange = jest.fn();
  const { container } = render(
    <OffsetCornerPanel cornerType="sharp" onValueChange={onValueChange} />
  );
  expect(container).toMatchSnapshot();

  fireEvent.click(container.querySelector('p.caption'));
  expect(container).toMatchSnapshot();

  fireEvent.change(container.querySelector('select'), {
    target: {
      value: 'round',
    },
  });
  expect(onValueChange).toHaveBeenCalledTimes(1);
  expect(onValueChange).toHaveBeenNthCalledWith(1, 'round');
  expect(container).toMatchSnapshot();
});
