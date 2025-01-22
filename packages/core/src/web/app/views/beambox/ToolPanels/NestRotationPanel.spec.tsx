import React from 'react';

import { fireEvent, render } from '@testing-library/react';

jest.mock('@core/helpers/i18n', () => ({
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

jest.mock('@core/app/widgets/Unit-Input-v2', () => ({ defaultValue, getValue, min }: any) => (
  <div>
    mock-unit-input min:{min}
    defaultValue:{defaultValue}
    <input className="unit-input" onChange={(e) => getValue(+e.target.value)} />
  </div>
));

import NestRotationPanel from './NestRotationPanel';

test('should render correctly', () => {
  const onValueChange = jest.fn();
  const { container } = render(<NestRotationPanel onValueChange={onValueChange} rotations={1} />);

  expect(container).toMatchSnapshot();

  fireEvent.change(container.querySelector('input.unit-input'), { target: { value: 2 } });
  expect(onValueChange).toHaveBeenCalledTimes(1);
  expect(onValueChange).toHaveBeenNthCalledWith(1, 2);
  expect(container).toMatchSnapshot();
});
