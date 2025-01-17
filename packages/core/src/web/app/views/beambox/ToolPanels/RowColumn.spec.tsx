/* eslint-disable import/first */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';

jest.mock('helpers/i18n', () => ({
  lang: {
    beambox: {
      tool_panels: {
        array_dimension: 'Array Dimension',
        rows: 'Rows',
        columns: 'Cols.',
      },
    },
  },
}));

jest.mock('app/widgets/Unit-Input-v2', () =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ id, min, defaultValue, getValue }: any) => (
    <div>
      mock-unit-input id:{id}
      min:{min}
      defaultValue:{defaultValue}
      <input className="unit-input" onChange={(e) => getValue(+e.target.value)} />
    </div>
  )
);

import RowColumn from './RowColumn';

describe('should render correctly', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('valid input', () => {
    const onValueChange = jest.fn();
    const { container, rerender } = render(
      <RowColumn row={2} column={3} onValueChange={onValueChange} />
    );
    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('p.caption'));
    expect(container).toMatchSnapshot();

    rerender(<RowColumn row={3} column={2} onValueChange={onValueChange} />);
    expect(container).toMatchSnapshot();

    const inputs = container.querySelectorAll('input.unit-input');
    fireEvent.change(inputs[0], { target: { value: 4 } });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenNthCalledWith(1, { row: 3, column: 4 });
    expect(container).toMatchSnapshot();

    fireEvent.change(inputs[1], { target: { value: 5 } });
    expect(onValueChange).toHaveBeenCalledTimes(2);
    expect(onValueChange).toHaveBeenNthCalledWith(2, { row: 5, column: 4 });
    expect(container).toMatchSnapshot();
  });

  test('invalid row and column input', () => {
    const { container } = render(<RowColumn row={0} column={0} onValueChange={jest.fn()} />);
    expect(container).toMatchSnapshot();
  });
});
