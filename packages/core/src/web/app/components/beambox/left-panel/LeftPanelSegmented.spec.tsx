import React from 'react';
import { render } from '@testing-library/react';

import LeftPanelSegmented from './LeftPanelSegmented';

describe('test LeftPanelSegmented', () => {
  const mockOnChange = jest.fn();

  it('should render correctly', () => {
    const { container } = render(
      <LeftPanelSegmented
        onChange={mockOnChange}
        options={[
          { label: 'Option 1', value: 1 },
          { label: 'Option 2', value: 2 },
        ]}
        value={1}
      />,
    );

    expect(container).toMatchSnapshot();
  });

  it('should call onChange when an option is clicked', () => {
    const { getByText } = render(
      <LeftPanelSegmented
        onChange={mockOnChange}
        options={[
          { label: 'Option 1', value: 1 },
          { label: 'Option 2', value: 2 },
        ]}
        value={1}
      />,
    );

    getByText('Option 2').click();

    expect(mockOnChange).toHaveBeenCalledWith(2);
  });
});
