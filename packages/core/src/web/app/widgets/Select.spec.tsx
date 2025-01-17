import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import Select from './Select';

describe('test Select', () => {
  test('should render correctly', () => {
    const mockOnChange = jest.fn();
    const { container, rerender } = render(
      <Select
        id="123"
        name="select-lang"
        className="test123"
        options={[
          {
            value: 'en',
            label: 'en',
            selected: true,
          },
          {
            value: 'es',
            label: 'es',
            selected: false,
          },
          {
            value: 'jp',
            label: 'jp',
            selected: true,
          },
        ]}
        multiple
        onChange={mockOnChange}
      />
    );
    expect(container).toMatchSnapshot();

    const select = container.querySelector('select');
    expect(select).toHaveValue(['en', 'jp']);
    fireEvent.change(container.querySelector('.test123'));
    expect(mockOnChange).toHaveBeenCalled();

    rerender(
      <Select
        id="123"
        name="select-lang"
        className="test123"
        options={[
          {
            value: 'en',
            label: 'en',
            selected: true,
          },
          {
            value: 'es',
            label: 'es',
            selected: false,
          },
          {
            value: 'jp',
            label: 'jp',
            selected: false,
          },
        ]}
        onChange={jest.fn()}
      />
    );
    expect(container).toMatchSnapshot();
    expect(select).toHaveValue('en');
  });
});
