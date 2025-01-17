/* eslint-disable import/first */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

jest.mock('helpers/i18n', () => ({
  lang: {
    beambox: {
      tool_panels: {
        _offset: {
          direction: 'Offset Direction',
          inward: 'Inward',
          outward: 'Outward',
        },
      },
    },
  },
}));

import OffsetDirectionPanel from './OffsetDirectionPanel';

test('should render correctly', () => {
  const onValueChange = jest.fn();
  const { container } = render(<OffsetDirectionPanel dir={1} onValueChange={onValueChange} />);
  expect(container).toMatchSnapshot();

  fireEvent.click(container.querySelector('p.caption'));
  expect(container).toMatchSnapshot();

  fireEvent.change(container.querySelector('select'), {
    target: {
      value: 0,
    },
  });
  expect(onValueChange).toHaveBeenCalledTimes(1);
  expect(onValueChange).toHaveBeenNthCalledWith(1, 0);
  expect(container).toMatchSnapshot();
});
