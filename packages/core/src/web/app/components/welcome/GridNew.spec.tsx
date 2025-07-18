import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import GridNew from './GridNew';

const mockStartNewProject = jest.fn();

describe('test GridNew', () => {
  it('should render correctly', () => {
    const { container } = render(<GridNew startNewProject={mockStartNewProject} />);

    expect(container).toMatchSnapshot();

    const button = container.querySelector('.button');

    fireEvent.click(button);
    expect(mockStartNewProject).toHaveBeenCalled();
  });
});
