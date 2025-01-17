import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import FieldBlock from './FieldBlock';

const mockSetField = jest.fn();
const mockField = { offsetX: 0, offsetY: 0, angle: 0 };

describe('test FieldBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(
      <FieldBlock width={300} isInch={false} field={mockField} setField={mockSetField} />
    );
    expect(container).toMatchSnapshot();
  });

  describe('test edit values', () => {
    [
      { id: 'offset-x', key: 'offsetX' },
      { id: 'offset-y', key: 'offsetY' },
      { id: 'angle', key: 'angle' },
    ].forEach(({ id, key }) => {
      test(`edit ${key}`, () => {
        const { getByTestId } = render(
          <FieldBlock width={300} isInch={false} field={mockField} setField={mockSetField} />
        );
        const input = getByTestId(id);
        fireEvent.change(input, { target: { value: '10' } });
        expect(mockSetField).toBeCalledTimes(1);
        const [[dispatch]] = mockSetField.mock.calls;
        expect(dispatch(mockField)).toEqual({ ...mockField, [key]: 10 });
      });
    });
  });
});
