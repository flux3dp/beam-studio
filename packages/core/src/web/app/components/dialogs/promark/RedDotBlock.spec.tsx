import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import RedDotBlock from './RedDotBlock';

const mockSetRedDot = jest.fn();
const mockRedDot = { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 };

describe('test RedDotBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(<RedDotBlock isInch={false} redDot={mockRedDot} setRedDot={mockSetRedDot} />);

    expect(container).toMatchSnapshot();
  });

  describe('test edit values', () => {
    [
      { id: 'offset-x', key: 'offsetX' },
      { id: 'offset-y', key: 'offsetY' },
      { id: 'scale-x', key: 'scaleX' },
      { id: 'scale-y', key: 'scaleY' },
    ].forEach(({ id, key }) => {
      test(`edit ${key}`, () => {
        const { getByTestId } = render(<RedDotBlock isInch={false} redDot={mockRedDot} setRedDot={mockSetRedDot} />);
        const input = getByTestId(id);

        fireEvent.change(input, {
          target: {
            value: '10',
          },
        });
        expect(mockSetRedDot).toHaveBeenCalledTimes(1);

        const [[dispatch]] = mockSetRedDot.mock.calls;

        expect(dispatch(mockRedDot)).toEqual({ ...mockRedDot, [key]: 10 });
      });
    });
  });
});
