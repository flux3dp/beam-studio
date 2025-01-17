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

jest.mock('app/widgets/Unit-Input-v2', () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ min, unit, defaultValue, getValue }: any) => (
    <div>
      mock-unit-input min:{min}
      unit:{unit}
      defaultValue:{defaultValue}
      <input className="unit-input" onChange={(e) => getValue(+e.target.value)} />
    </div>
  )
);

import OffsetDistancePanel from './OffsetDistancePanel';

describe('should render correctly', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('default unit is inches', () => {
    get.mockReturnValue('inches');
    const onValueChange = jest.fn();
    const { container } = render(
      <OffsetDistancePanel distance={100} onValueChange={onValueChange} />
    );
    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('p.caption'));
    expect(container).toMatchSnapshot();

    fireEvent.change(container.querySelector('input.unit-input'), { target: { value: 50 } });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenNthCalledWith(1, 50);
    expect(container).toMatchSnapshot();
  });

  test('default unit is mm', () => {
    get.mockReturnValue(undefined);
    const { container, rerender } = render(
      <OffsetDistancePanel distance={100} onValueChange={jest.fn()} />
    );
    expect(container).toMatchSnapshot();

    get.mockReturnValue(undefined);
    rerender(<OffsetDistancePanel distance={100} onValueChange={jest.fn()} />);
    expect(container).toMatchSnapshot();
  });
});
