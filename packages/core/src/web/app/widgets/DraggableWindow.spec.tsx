import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import DraggbleWindow from './DraggableWindow';

test('should render correctly', () => {
  const mockOnClose = jest.fn();
  const { container } = render(
    <DraggbleWindow
      containerClass="123"
      defaultPosition={{ x: 0, y: 0 }}
      handleClass="456"
      onClose={mockOnClose}
      title="Beam Studio"
    />,
  );

  expect(container).toMatchSnapshot();

  fireEvent.click(container.querySelector('.traffic-light-close'));
  expect(mockOnClose).toHaveBeenCalledTimes(1);
});
