import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import LeftPanelButton from './LeftPanelButton';

const mockOnClick = jest.fn();

describe('test LeftPanelButton', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should render correctly', () => {
    const { container } = render(
      <LeftPanelButton icon={<div>test</div>} id="test" onClick={mockOnClick} title="test" />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should render flux plus icon correctly', () => {
    const { container } = render(
      <LeftPanelButton icon={<div>test</div>} id="test" onClick={mockOnClick} showBadge title="test" />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should call onClick when click', () => {
    const { container } = render(
      <LeftPanelButton icon={<div>test</div>} id="test" onClick={mockOnClick} title="test" />,
    );

    expect(mockOnClick).not.toHaveBeenCalled();
    fireEvent.click(container.querySelector('.container'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
