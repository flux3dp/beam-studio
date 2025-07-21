import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const mockOpen = jest.fn();

jest.mock('@core/implementations/browser', () => ({
  open: mockOpen,
}));

import GridGuide from './GridGuide';

const mockGuide = {
  category: 360000126835,
  name: 'Beam Studio',
  src: 'core-img/BeamStudio-logo.png',
};

describe('test GridGuide', () => {
  it('should render correctly', () => {
    const { container } = render(<GridGuide baseUrl="mock-base-url" guide={mockGuide} />);

    expect(container).toMatchSnapshot();

    const grid = container.querySelector('.grid');

    fireEvent.click(grid);
    expect(mockOpen).toHaveBeenCalledWith('mock-base-url/categories/360000126835');
  });
});
