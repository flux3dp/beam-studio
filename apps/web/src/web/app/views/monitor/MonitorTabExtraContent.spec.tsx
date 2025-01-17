import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { Mode, ItemType } from 'app/constants/monitor-constants';
import { MonitorContext } from 'app/contexts/MonitorContext';

import MonitorTabExtraContent from './MonitorTabExtraContent';

jest.mock('app/contexts/MonitorContext', () => ({
  MonitorContext: React.createContext(null),
}));

const mockOnDownload = jest.fn();
const mockShowUploadDialog = jest.fn();
const mockContext = {
  currentPath: ['SD', 'test'],
  mode: Mode.FILE,
  highlightedItem: { type: ItemType.FILE, name: 'test' },
  onDownload: mockOnDownload,
  showUploadDialog: mockShowUploadDialog,
};

describe('test MonitorTabExtraContent', () => {
  it('should render correctly', () => {
    const { container } = render(
      <MonitorContext.Provider value={mockContext as any}>
        <MonitorTabExtraContent />
      </MonitorContext.Provider>
    );
    expect(container).toMatchSnapshot();
    const uploadBtn = container.querySelectorAll('button')[0];
    expect(mockShowUploadDialog).not.toHaveBeenCalled();
    fireEvent.click(uploadBtn);
    expect(mockShowUploadDialog).toBeCalledTimes(1);

    const downloadBtn = container.querySelectorAll('button')[1];
    expect(mockOnDownload).not.toHaveBeenCalled();
    fireEvent.click(downloadBtn);
    expect(mockOnDownload).toBeCalledTimes(1);
  });

  it('should render correctly when mode is not file', () => {
    const { container } = render(
      <MonitorContext.Provider value={{ ...mockContext, mode: Mode.CAMERA } as any}>
        <MonitorTabExtraContent />
      </MonitorContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it('should render correctly when highlightedItem is not file', () => {
    const { container } = render(
      <MonitorContext.Provider
        value={{ ...mockContext, highlightedItem: { type: ItemType.FOLDER, name: 'test' } } as any}
      >
        <MonitorTabExtraContent />
      </MonitorContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });

  it('should render correctly when currentPath is empty', () => {
    const { container } = render(
      <MonitorContext.Provider value={{ ...mockContext, currentPath: [] } as any}>
        <MonitorTabExtraContent />
      </MonitorContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
