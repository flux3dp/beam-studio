import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { setStorage } from '@mocks/@core/app/stores/storageStore';

jest.mock('@core/app/widgets/Unit-Input-v2', () => ({ defaultValue, getValue, min, unit }: any) => (
  <div>
    mock-unit-input min:{min}
    unit:{unit}
    defaultValue:{defaultValue}
    <input className="unit-input" onChange={(e) => getValue(+e.target.value)} />
  </div>
));

import NestSpacingPanel from './NestSpacingPanel';

describe('should render correctly', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('default unit is inches', () => {
    setStorage('default-units', 'inches');

    const onValueChange = jest.fn();
    const { container } = render(<NestSpacingPanel onValueChange={onValueChange} spacing={100} />);

    expect(container).toMatchSnapshot();

    fireEvent.change(container.querySelector('input.unit-input'), { target: { value: 50 } });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenNthCalledWith(1, 50);
    expect(container).toMatchSnapshot();
  });

  test('default unit is mm', () => {
    setStorage('default-units', 'mm');

    const onValueChange = jest.fn();
    const { container } = render(<NestSpacingPanel onValueChange={onValueChange} spacing={100} />);

    expect(container).toMatchSnapshot();
  });
});
