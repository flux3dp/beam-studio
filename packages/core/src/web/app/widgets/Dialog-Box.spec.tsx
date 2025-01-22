import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import DialogBox from './Dialog-Box';

test('should render correctly', () => {
  const mockOnClose = jest.fn();
  const { container } = render(
    <DialogBox
      arrowColor="black"
      arrowDirection="top"
      arrowHeight={10}
      arrowPadding={30}
      arrowWidth={20}
      content="Hello World"
      onClose={mockOnClose}
      position={{}}
    />,
  );

  expect(container).toMatchSnapshot();

  fireEvent.click(container.querySelector('.close-btn'));
  expect(mockOnClose).toHaveBeenCalledTimes(1);
});
