import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import DialogBox from './Dialog-Box';

test('should render correctly', () => {
  const mockOnClose = jest.fn();
  const { container } = render(
    <DialogBox
      arrowDirection="top"
      arrowHeight={10}
      arrowWidth={20}
      arrowColor="black"
      arrowPadding={30}
      position={{}}
      onClose={mockOnClose}
      content="Hello World"
    />
  );
  expect(container).toMatchSnapshot();

  fireEvent.click(container.querySelector('.close-btn'));
  expect(mockOnClose).toHaveBeenCalledTimes(1);
});
