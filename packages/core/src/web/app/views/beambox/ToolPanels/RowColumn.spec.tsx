import React from 'react';

import { fireEvent, render } from '@testing-library/react';

jest.mock('@core/helpers/i18n', () => ({
  lang: {
    beambox: {
      tool_panels: {
        array_dimension: 'Array Dimension',
        columns: 'Cols.',
        rows: 'Rows',
      },
    },
  },
}));

jest.mock('@core/app/widgets/Unit-Input-v2', () => ({ defaultValue, getValue, id, min }: any) => (
  <div>
    mock-unit-input id:{id}
    min:{min}
    defaultValue:{defaultValue}
    <input className="unit-input" onChange={(e) => getValue(+e.target.value)} />
  </div>
));

import RowColumn from './RowColumn';

describe('should render correctly', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('valid input', () => {
    const onValueChange = jest.fn();
    const { container, rerender } = render(<RowColumn column={3} onValueChange={onValueChange} row={2} />);

    expect(container).toMatchSnapshot();

    fireEvent.click(container.querySelector('p.caption'));
    expect(container).toMatchSnapshot();

    rerender(<RowColumn column={2} onValueChange={onValueChange} row={3} />);
    expect(container).toMatchSnapshot();

    const inputs = container.querySelectorAll('input.unit-input');

    fireEvent.change(inputs[0], { target: { value: 4 } });
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenNthCalledWith(1, { column: 4, row: 3 });
    expect(container).toMatchSnapshot();

    fireEvent.change(inputs[1], { target: { value: 5 } });
    expect(onValueChange).toHaveBeenCalledTimes(2);
    expect(onValueChange).toHaveBeenNthCalledWith(2, { column: 4, row: 5 });
    expect(container).toMatchSnapshot();
  });

  test('invalid row and column input', () => {
    const { container } = render(<RowColumn column={0} onValueChange={jest.fn()} row={0} />);

    expect(container).toMatchSnapshot();
  });
});
