import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import LensBlock from './LensBlock';

const mockSetData = jest.fn();
const mockData = {
  x: { bulge: 1.1, scale: 101, skew: 1.1, trapezoid: 1.1 },
  y: { bulge: 0.9, scale: 99, skew: 0.9, trapezoid: 0.9 },
};

describe('test LensBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(<LensBlock data={mockData} setData={mockSetData} />);

    expect(container).toMatchSnapshot();
  });

  describe('test edit values', () => {
    [
      { axis: 'x', id: 'scale-x', key: 'scale', value: 100 },
      { axis: 'x', id: 'bulge-x', key: 'bulge', value: 1 },
      { axis: 'x', id: 'skew-x', key: 'skew', value: 1 },
      { axis: 'x', id: 'trapezoid-x', key: 'trapezoid', value: 1 },
      { axis: 'y', id: 'scale-y', key: 'scale', value: 100 },
      { axis: 'y', id: 'bulge-y', key: 'bulge', value: 1 },
      { axis: 'y', id: 'skew-y', key: 'skew', value: 1 },
      { axis: 'y', id: 'trapezoid-y', key: 'trapezoid', value: 1 },
    ].forEach(({ axis, id, key, value }) => {
      test(`edit ${key} of ${axis}`, () => {
        const { getByTestId } = render(<LensBlock data={mockData} setData={mockSetData} />);
        const input = getByTestId(id);

        fireEvent.change(input, { target: { value: value.toString() } });
        expect(mockSetData).toHaveBeenCalledTimes(1);

        const [[dispatch]] = mockSetData.mock.calls;

        expect(dispatch(mockData)).toEqual({
          ...mockData,
          [axis]: { ...mockData[axis], [key]: value },
        });
      });
    });
  });

  test('switch axis', () => {
    const { getByText } = render(<LensBlock data={mockData} setData={mockSetData} />);
    const btn = getByText('Switch X/Y');

    fireEvent.click(btn);
    expect(mockSetData).toHaveBeenCalledTimes(1);

    const [[dispatch]] = mockSetData.mock.calls;

    expect(dispatch(mockData)).toEqual({
      x: mockData.y,
      y: mockData.x,
    });
  });
});
