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
      <LeftPanelButton id="test" title="test" icon={<div>test</div>} onClick={mockOnClick} />
    );
    expect(container).toMatchSnapshot();
  });

  it('should render flux plus icon correctly', () => {
    const { container } = render(
      <LeftPanelButton
        id="test"
        title="test"
        icon={<div>test</div>}
        onClick={mockOnClick}
        showBadge
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should call onClick when click', () => {
    const { container } = render(
      <LeftPanelButton id="test" title="test" icon={<div>test</div>} onClick={mockOnClick} />
    );
    expect(mockOnClick).not.toBeCalled();
    fireEvent.click(container.querySelector('.container'));
    expect(mockOnClick).toBeCalledTimes(1);
  });
});
