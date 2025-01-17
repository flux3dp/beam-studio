import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import LensBlock from './LensBlock';

const mockSetData = jest.fn();
const mockData = {
  x: { scale: 101, bulge: 1.1, skew: 1.1, trapezoid: 1.1 },
  y: { scale: 99, bulge: 0.9, skew: 0.9, trapezoid: 0.9 },
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
      { axis: 'x', key: 'scale', id: 'scale-x', value: 100 },
      { axis: 'x', key: 'bulge', id: 'bulge-x', value: 1 },
      { axis: 'x', key: 'skew', id: 'skew-x', value: 1 },
      { axis: 'x', key: 'trapezoid', id: 'trapezoid-x', value: 1 },
      { axis: 'y', key: 'scale', id: 'scale-y', value: 100 },
      { axis: 'y', key: 'bulge', id: 'bulge-y', value: 1 },
      { axis: 'y', key: 'skew', id: 'skew-y', value: 1 },
      { axis: 'y', key: 'trapezoid', id: 'trapezoid-y', value: 1 },
    ].forEach(({ axis, key, id, value }) => {
      test(`edit ${key} of ${axis}`, () => {
        const { getByTestId } = render(<LensBlock data={mockData} setData={mockSetData} />);
        const input = getByTestId(id);
        fireEvent.change(input, { target: { value: value.toString() } });
        expect(mockSetData).toBeCalledTimes(1);
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
    expect(mockSetData).toBeCalledTimes(1);
    const [[dispatch]] = mockSetData.mock.calls;
    expect(dispatch(mockData)).toEqual({
      x: mockData.y,
      y: mockData.x,
    });
  });
});
