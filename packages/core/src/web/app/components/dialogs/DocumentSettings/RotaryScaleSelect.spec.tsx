import React, { act } from 'react';

import { fireEvent, render } from '@testing-library/react';

import RotaryScaleSelect from './RotaryScaleSelect';

const mockOnChange = jest.fn();

describe('test RotaryScaleSelect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(<RotaryScaleSelect id="id" onChange={mockOnChange} title="title" value={1} />);

    expect(container).toMatchSnapshot();
  });

  test('should call onChange when select value changed', () => {
    const { baseElement } = render(<RotaryScaleSelect id="id" onChange={mockOnChange} title="title" value={1} />);

    act(() => fireEvent.mouseDown(baseElement.querySelector('input#id')));
    fireEvent.click(baseElement.querySelector('.rc-virtual-list [title="2"]'));

    expect(mockOnChange).toHaveBeenCalledWith(2);
  });
});
