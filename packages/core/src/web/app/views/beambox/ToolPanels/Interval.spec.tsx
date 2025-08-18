import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const mockUseWorkarea = jest.fn();

jest.mock('@core/helpers/hooks/useWorkarea', () => mockUseWorkarea);

const mockGetWorkarea = jest.fn();

jest.mock('@core/app/constants/workarea-constants', () => ({
  getWorkarea: mockGetWorkarea,
}));

jest.mock('@core/app/widgets/Unit-Input-v2', () => ({ defaultValue, getValue, id, max, min, unit }: any) => (
  <div>
    mock-unit-input id:{id}
    unit:{unit}
    min:{min}
    max:{max}
    defaultValue:{defaultValue}
    <input className="unit-input" onChange={(e) => getValue(+e.target.value)} />
  </div>
));

import Interval from './Interval';
import { setStorage } from '@mocks/@core/app/stores/storageStore';

describe('should render correctly', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setStorage('default-units', 'mm');
    mockUseWorkarea.mockReturnValue('fbb1b');
    mockGetWorkarea.mockReturnValue({ height: 375, width: 400 });
  });

  test('default unit is inches', () => {
    setStorage('default-units', 'inches');

    const onValueChange = jest.fn();
    const { container, rerender } = render(<Interval dx={25.4} dy={25.4} onValueChange={onValueChange} />);

    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('p.caption'));
    expect(container).toMatchSnapshot();

    rerender(<Interval dx={254} dy={254} onValueChange={onValueChange} />);
    expect(container).toMatchSnapshot();

    const inputs = container.querySelectorAll('input.unit-input');

    fireEvent.change(inputs[0], { target: { value: 100 } });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenNthCalledWith(1, { dx: 100, dy: 254 });
    expect(container).toMatchSnapshot();

    fireEvent.change(inputs[1], { target: { value: 100 } });
    expect(onValueChange).toHaveBeenCalledTimes(2);
    expect(onValueChange).toHaveBeenNthCalledWith(2, { dx: 100, dy: 100 });
    expect(container).toMatchSnapshot();
  });

  test('default unit is mm', () => {
    const { container } = render(<Interval dx={25.4} dy={25.4} onValueChange={jest.fn()} />);

    expect(container).toMatchSnapshot();
  });
});
