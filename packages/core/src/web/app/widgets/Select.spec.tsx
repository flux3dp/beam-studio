import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import Select from './Select';

describe('test Select', () => {
  test('should render correctly', () => {
    const mockOnChange = jest.fn();
    const { container, rerender } = render(
      <Select
        className="test123"
        id="123"
        multiple
        name="select-lang"
        onChange={mockOnChange}
        options={[
          {
            label: 'en',
            selected: true,
            value: 'en',
          },
          {
            label: 'es',
            selected: false,
            value: 'es',
          },
          {
            label: 'jp',
            selected: true,
            value: 'jp',
          },
        ]}
      />,
    );

    expect(container).toMatchSnapshot();

    const select = container.querySelector('select');

    expect(select).toHaveValue(['en', 'jp']);
    fireEvent.change(container.querySelector('.test123'));
    expect(mockOnChange).toHaveBeenCalled();

    rerender(
      <Select
        className="test123"
        id="123"
        name="select-lang"
        onChange={jest.fn()}
        options={[
          {
            label: 'en',
            selected: true,
            value: 'en',
          },
          {
            label: 'es',
            selected: false,
            value: 'es',
          },
          {
            label: 'jp',
            selected: false,
            value: 'jp',
          },
        ]}
      />,
    );
    expect(container).toMatchSnapshot();
    expect(select).toHaveValue('en');
  });
});
