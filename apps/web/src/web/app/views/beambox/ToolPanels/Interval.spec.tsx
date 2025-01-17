/* eslint-disable import/first */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

jest.mock('helpers/i18n', () => ({
  lang: {
    beambox: {
      tool_panels: {
        _offset: {
          dist: 'Offset Distance',
        },
      },
    },
  },
}));

const get = jest.fn();
jest.mock('implementations/storage', () => ({
  get,
}));

const read = jest.fn();
jest.mock('app/actions/beambox/beambox-preference', () => ({
  read,
}));

jest.mock('app/widgets/Unit-Input-v2', () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ id, unit, min, max, defaultValue, getValue }: any) => (
    <div>
      mock-unit-input id:{id}
      unit:{unit}
      min:{min}
      max:{max}
      defaultValue:{defaultValue}
      <input className="unit-input" onChange={(e) => getValue(+e.target.value)} />
    </div>
  )
);

import Interval from './Interval';

describe('should render correctly', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('default unit is inches', () => {
    get.mockReturnValue('inches');
    read.mockReturnValue('fbb1b');
    const onValueChange = jest.fn();
    const { container, rerender } = render(
      <Interval dx={25.4} dy={25.4} onValueChange={onValueChange} />
    );
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
    get.mockReturnValue(undefined);
    read.mockReturnValue('fbb1b');
    const { container } = render(<Interval dx={25.4} dy={25.4} onValueChange={jest.fn()} />);
    expect(container).toMatchSnapshot();
  });
});
