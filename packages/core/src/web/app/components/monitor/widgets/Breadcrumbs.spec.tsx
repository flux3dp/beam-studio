import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { MonitorContext } from '@core/app/contexts/MonitorContext';

import Breadcrumbs from './Breadcrumbs';

jest.mock('@core/app/contexts/MonitorContext', () => ({
  MonitorContext: React.createContext(null),
}));

const mockOnSelectFolder = jest.fn();

describe('test Breadcrumbs', () => {
  it('should render correctly', () => {
    const { container } = render(
      <MonitorContext
        value={
          {
            currentPath: ['a', 'b', 'c'],
            onSelectFolder: mockOnSelectFolder,
          } as any
        }
      >
        <Breadcrumbs />
      </MonitorContext>,
    );

    expect(container).toMatchSnapshot();
  });

  test('selecting folders should work', () => {
    const { container, getByText } = render(
      <MonitorContext
        value={
          {
            currentPath: ['a', 'b', 'c'],
            onSelectFolder: mockOnSelectFolder,
          } as any
        }
      >
        <Breadcrumbs />
      </MonitorContext>,
    );
    const home = container.querySelector('[aria-label="home"]');

    expect(mockOnSelectFolder).not.toHaveBeenCalled();
    fireEvent.click(home);
    expect(mockOnSelectFolder).toHaveBeenLastCalledWith('', true);

    fireEvent.click(getByText('a'));
    expect(mockOnSelectFolder).toHaveBeenLastCalledWith('a', true);
    fireEvent.click(getByText('b'));
    expect(mockOnSelectFolder).toHaveBeenLastCalledWith('a/b', true);
    fireEvent.click(getByText('c'));
    expect(mockOnSelectFolder).toHaveBeenLastCalledWith('a/b/c', true);
  });
});
