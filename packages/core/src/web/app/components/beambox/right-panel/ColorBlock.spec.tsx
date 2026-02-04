import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import ColorBlock from './ColorBlock';

const mockOnClick = jest.fn();

describe('test ColorBlock', () => {
  it('should render correctly', () => {
    const { container } = render(
      <ColorBlock className="mock-class" color="#333333" id="mock-id" onClick={mockOnClick} size="small" />,
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

    expect(mockOnClick).not.toHaveBeenCalled();
    fireEvent.click(container.querySelector('div.color>div'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
