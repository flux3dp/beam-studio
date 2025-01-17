/* eslint-disable import/first */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

jest.mock('helpers/i18n', () => ({
  lang: {
    beambox: {
      tool_panels: {
        _nest: {
          rotations: 'Possible Rotation',
        },
      },
    },
  },
}));

jest.mock('app/widgets/Unit-Input-v2', () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ min, defaultValue, getValue }: any) => (
    <div>
      mock-unit-input min:{min}
      defaultValue:{defaultValue}
      <input className="unit-input" onChange={(e) => getValue(+e.target.value)} />
    </div>
  )
);

import NestRotationPanel from './NestRotationPanel';

test('should render correctly', () => {
  const onValueChange = jest.fn();
  const { container } = render(<NestRotationPanel rotations={1} onValueChange={onValueChange} />);
  expect(container).toMatchSnapshot();

  fireEvent.change(container.querySelector('input.unit-input'), { target: { value: 2 } });
  expect(onValueChange).toHaveBeenCalledTimes(1);
  expect(onValueChange).toHaveBeenNthCalledWith(1, 2);
  expect(container).toMatchSnapshot();
});
