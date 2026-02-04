import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import FieldBlock from './FieldBlock';

const mockSetField = jest.fn();
const mockField = { angle: 0, offsetX: 0, offsetY: 0 };

describe('test FieldBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(<FieldBlock field={mockField} isInch={false} setField={mockSetField} width={300} />);

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
          <FieldBlock field={mockField} isInch={false} setField={mockSetField} width={300} />,
        );
        const input = getByTestId(id);

        fireEvent.change(input, { target: { value: '10' } });
        expect(mockSetField).toHaveBeenCalledTimes(1);

        const [[dispatch]] = mockSetField.mock.calls;

        expect(dispatch(mockField)).toEqual({ ...mockField, [key]: 10 });
      });
    });
  });
});
