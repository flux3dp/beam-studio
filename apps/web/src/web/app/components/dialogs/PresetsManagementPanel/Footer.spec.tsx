import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import Footer from './Footer';

describe('test Footer', () => {
  it('should render correctly and buttons should work', () => {
    const handleSave = jest.fn();
    const handleReset = jest.fn();
    const onClose = jest.fn();
    const { getByText } = render(
      <Footer handleSave={handleSave} handleReset={handleReset} onClose={onClose} />,
    );
    fireEvent.click(getByText('Reset'));
    expect(handleReset).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(getByText('Save and Exit'));
    expect(handleSave).toHaveBeenCalledTimes(1);
  });
});
