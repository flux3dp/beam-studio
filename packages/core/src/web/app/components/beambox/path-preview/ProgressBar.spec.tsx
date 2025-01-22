import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import ProgressBar from './ProgressBar';

test('should render correctly', () => {
  const handleSimTimeChange = jest.fn();
  const { container } = render(<ProgressBar handleSimTimeChange={handleSimTimeChange} simTime={0.5} simTimeMax={1} />);

  expect(container).toMatchSnapshot();

  fireEvent.change(container.querySelector('input.slider'), {
    target: { value: 0.7 },
  });
  expect(handleSimTimeChange).toHaveBeenCalledTimes(1);
  expect(handleSimTimeChange).toHaveBeenNthCalledWith(1, 0.000011666666666666666);
});
