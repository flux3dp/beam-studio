import React from 'react';

import { fireEvent, render } from '@testing-library/react';

const mockClearScene = jest.fn();

jest.mock('@core/app/actions/beambox/svgeditor-function-wrapper', () => ({
  clearScene: mockClearScene,
}));

import GridNew from './GridNew';

describe('test GridNew', () => {
  it('should render correctly', () => {
    const { container } = render(<GridNew />);

    expect(container).toMatchSnapshot();

    const button = container.querySelector('.button');

    fireEvent.click(button);
    expect(mockClearScene).toHaveBeenCalled();
  });
});
