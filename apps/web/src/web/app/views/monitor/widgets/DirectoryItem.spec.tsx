import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { MonitorContext } from 'app/contexts/MonitorContext';

import DirectoryItem from './DirectoryItem';

jest.mock('app/contexts/MonitorContext', () => ({
  MonitorContext: React.createContext(null),
}));

const mockOnHighlightItem = jest.fn();
const mockOnSelectFolder = jest.fn();

describe('test DirectoryItem', () => {
  it('should render correctly', () => {
    const { container, rerender } = render(
      <MonitorContext.Provider value={{
        onHighlightItem: mockOnHighlightItem,
        onSelectFolder: mockOnSelectFolder,
        highlightedItem: { name: 'directory', type: 'FOLDER' }
      } as any}
      >
        <DirectoryItem name="directory" />
      </MonitorContext.Provider>
    );
    expect(container).toMatchSnapshot();
    rerender(
      <MonitorContext.Provider value={{
        onHighlightItem: mockOnHighlightItem,
        onSelectFolder: mockOnSelectFolder,
        highlightedItem: { name: 'directory2', type: 'FOLDER' }
      } as any}
      >
        <DirectoryItem name="directory" />
      </MonitorContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  test('context events should work', () => {
    const { container } = render(
      <MonitorContext.Provider value={{
        onHighlightItem: mockOnHighlightItem,
        onSelectFolder: mockOnSelectFolder,
        highlightedItem: { name: 'directory', type: 'FOLDER' }
      } as any}
      >
        <DirectoryItem name="directory" />
      </MonitorContext.Provider>
    );
    const divContainer = container.querySelector('.container');
    expect(mockOnHighlightItem).not.toBeCalled();
    fireEvent.click(divContainer);
    expect(mockOnHighlightItem).toBeCalledTimes(1);
    expect(mockOnHighlightItem).toHaveBeenLastCalledWith({ name: 'directory', type: 'FOLDER' });

    expect(mockOnSelectFolder).not.toBeCalled();
    fireEvent.doubleClick(divContainer);
    expect(mockOnSelectFolder).toBeCalledTimes(1);
    expect(mockOnSelectFolder).toHaveBeenLastCalledWith('directory');
  });
});
