import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import ColorBlock from './ColorBlock';

const mockOnClick = jest.fn();

describe('test ColorBlock', () => {
  it('should render correctly', () => {
    const { container } = render(
      <ColorBlock
        id="mock-id"
        className="mock-class"
        size="small"
        color="#333333"
        onClick={mockOnClick}
      />
    );
    expect(container).toMatchSnapshot();
  });

  test('full color', () => {
    const { container } = render(<ColorBlock color="fullcolor" />);
    expect(container).toMatchSnapshot();
  });

  test('no color', () => {
    const { container } = render(<ColorBlock color="none" />);
    expect(container).toMatchSnapshot();
  });

  test('onClick', () => {
    const { container } = render(<ColorBlock color="#333333" onClick={mockOnClick} />);
    expect(mockOnClick).not.toBeCalled();
    fireEvent.click(container.querySelector('div.color>div'));
    expect(mockOnClick).toBeCalledTimes(1);
  });
});
