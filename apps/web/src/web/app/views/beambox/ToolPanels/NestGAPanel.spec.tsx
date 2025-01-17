import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import NestGAPanel from './NestGAPanel';

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

test('should render correctly', () => {
  const updateNestOptions = jest.fn();
  const { container } = render(
    <NestGAPanel
      nestOptions={{
        generations: 3,
        population: 10,
      }}
      updateNestOptions={updateNestOptions}
    />
  );
  expect(container).toMatchSnapshot();

  const inputs = container.querySelectorAll('input.unit-input');
  fireEvent.change(inputs[0], { target: { value: 2 } });
  expect(updateNestOptions).toHaveBeenCalledTimes(1);
  expect(updateNestOptions).toHaveBeenNthCalledWith(1, { generations: 2 });
  expect(container).toMatchSnapshot();

  fireEvent.change(inputs[1], { target: { value: 9 } });
  expect(updateNestOptions).toHaveBeenCalledTimes(2);
  expect(updateNestOptions).toHaveBeenNthCalledWith(2, { population: 9 });
  expect(container).toMatchSnapshot();
});
