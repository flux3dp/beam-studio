import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import ModalBlock from './ModalBlock';

const mockSetValue = jest.fn();

describe('test ColorRatioBlock', () => {
  it('should render correctly', () => {
    const { container } = render(
      <ModalBlock color="c" label="label" max={200} min={0} setValue={mockSetValue} title="title" value={50} />,
    );

    expect(container).toMatchSnapshot();
  });

  test('setValue should work', () => {
    const { container, rerender } = render(
      <ModalBlock color="c" label="label" max={200} min={0} setValue={mockSetValue} title="title" value={50} />,
    );

    expect(mockSetValue).not.toHaveBeenCalled();

    const ratioInput = container.querySelectorAll('input')[0];

    fireEvent.change(ratioInput, { target: { value: 49 } });
    expect(mockSetValue).toHaveBeenCalledTimes(1);
    expect(mockSetValue).toHaveBeenLastCalledWith(49);
    rerender(<ModalBlock color="c" label="label" max={200} min={0} setValue={mockSetValue} title="title" value={49} />);
    expect(ratioInput.value).toBe('49');
  });
});
