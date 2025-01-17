import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import DraggbleWindow from './DraggableWindow';

test('should render correctly', () => {
  const mockOnClose = jest.fn();
  const { container } = render(
    <DraggbleWindow
      title="Beam Studio"
      defaultPosition={{ x: 0, y: 0 }}
      containerClass="123"
      handleClass="456"
      onClose={mockOnClose}
    />
  );
  expect(container).toMatchSnapshot();

  fireEvent.click(container.querySelector('.traffic-light-close'));
  expect(mockOnClose).toHaveBeenCalledTimes(1);
});
