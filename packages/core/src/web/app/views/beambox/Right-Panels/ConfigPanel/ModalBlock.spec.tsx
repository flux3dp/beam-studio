import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import ModalBlock from './ModalBlock';

const mockSetValue = jest.fn();

describe('test ColorRatioBlock', () => {
  it('should render correctly', () => {
    const { container } = render(
      <ModalBlock
        value={50}
        label="label"
        title="title"
        setValue={mockSetValue}
        color="c"
        min={0}
        max={200}
      />
    );
    expect(container).toMatchSnapshot();
  });

  test('setValue should work', () => {
    const { container, rerender } = render(
      <ModalBlock
        value={50}
        label="label"
        title="title"
        setValue={mockSetValue}
        color="c"
        min={0}
        max={200}
      />
    );
    expect(mockSetValue).not.toBeCalled();
    const ratioInput = container.querySelectorAll('input')[0];
    fireEvent.change(ratioInput, { target: { value: 49 } });
    expect(mockSetValue).toBeCalledTimes(1);
    expect(mockSetValue).toHaveBeenLastCalledWith(49);
    rerender(
      <ModalBlock
        value={49}
        label="label"
        title="title"
        setValue={mockSetValue}
        color="c"
        min={0}
        max={200}
      />
    );
    expect(ratioInput.value).toBe('49');
  });
});
