import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import ColorCurveControl from './ColorCurveControl';

const mockSetValue = jest.fn();

jest.mock('antd', () => ({
  Slider: ({ onChange, onChangeComplete, value }) => (
    <input
      onChange={(e) => {
        const newValue = JSON.parse(e.target.value);

        onChange(newValue);
        onChangeComplete(newValue);
      }}
      value={JSON.stringify(value)}
    />
  ),
}));

describe('ColorCurveControl', () => {
  it('should render correctly', () => {
    const { container } = render(
      <ColorCurveControl color="c" setValue={mockSetValue} title="title" value={[1, 2, 3, 4, 5]} />,
    );

    expect(container).toMatchSnapshot();
  });

  test('change value', () => {
    const { container } = render(
      <ColorCurveControl color="c" setValue={mockSetValue} title="title" value={[1, 2, 3, 4, 5]} />,
    );
    const input = container.querySelector('input');

    fireEvent.change(input, { target: { value: '[10,20,30,40,50]' } });

    expect(mockSetValue).toHaveBeenCalledWith([10, 20, 30, 40, 50]);
  });
});
