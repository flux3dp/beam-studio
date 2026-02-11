import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import { MonitorContext } from '@core/app/contexts/MonitorContext';

import DirectoryItem from './DirectoryItem';

jest.mock('@core/app/contexts/MonitorContext', () => ({
  MonitorContext: React.createContext(null),
}));

const mockOnHighlightItem = jest.fn();
const mockOnSelectFolder = jest.fn();

describe('test DirectoryItem', () => {
  it('should render correctly', () => {
    const { container, rerender } = render(
      <MonitorContext
        value={
          {
            highlightedItem: { name: 'directory', type: 'FOLDER' },
            onHighlightItem: mockOnHighlightItem,
            onSelectFolder: mockOnSelectFolder,
          } as any
        }
      >
        <DirectoryItem name="directory" />
      </MonitorContext>,
    );

    expect(container).toMatchSnapshot();
    rerender(
      <MonitorContext
        value={
          {
            highlightedItem: { name: 'directory2', type: 'FOLDER' },
            onHighlightItem: mockOnHighlightItem,
            onSelectFolder: mockOnSelectFolder,
          } as any
        }
      >
        <DirectoryItem name="directory" />
      </MonitorContext>,
    );
    expect(container).toMatchSnapshot();
  });

  test('context events should work', () => {
    const { container } = render(
      <MonitorContext
        value={
          {
            highlightedItem: { name: 'directory', type: 'FOLDER' },
            onHighlightItem: mockOnHighlightItem,
            onSelectFolder: mockOnSelectFolder,
          } as any
        }
      >
        <DirectoryItem name="directory" />
      </MonitorContext>,
    );
    const divContainer = container.querySelector('.container');

    expect(mockOnHighlightItem).not.toHaveBeenCalled();
    fireEvent.click(divContainer);
    expect(mockOnHighlightItem).toHaveBeenCalledTimes(1);
    expect(mockOnHighlightItem).toHaveBeenLastCalledWith({ name: 'directory', type: 'FOLDER' });

    expect(mockOnSelectFolder).not.toHaveBeenCalled();
    fireEvent.doubleClick(divContainer);
    expect(mockOnSelectFolder).toHaveBeenCalledTimes(1);
    expect(mockOnSelectFolder).toHaveBeenLastCalledWith('directory');
  });
});
