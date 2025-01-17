import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { IAnnouncement } from 'interfaces/IAnnouncement';

import AnnouncementPanel from './AnnouncementPanel';

const mockAnnouncement: IAnnouncement = {
  id: 11,
  title: 'mock title',
  content: 'mock content',
  link: 'https://example.com',
  link_text: 'mock link content',
};

jest.mock('helpers/useI18n', () => () => ({
  alert: {
    learn_more: 'Learn More',
    close: 'Close',
  },
  beambox: {
    announcement_panel: {
      title: 'Announcement',
      dont_show_again: "Don't show again",
    },
  },
}));

const mockOpen = jest.fn();
jest.mock('implementations/browser', () => ({
  open: (...args) => mockOpen(...args),
}));

const mockSetNotShowing = jest.fn();
jest.mock('helpers/announcement-helper', () => ({
  setNotShowing: (...args) => mockSetNotShowing(...args),
}));

const mockOnClose = jest.fn();

describe('test AnnouncementPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { baseElement, getByText } = render(
      <AnnouncementPanel announcement={mockAnnouncement} onClose={mockOnClose} />
    );
    expect(baseElement).toMatchSnapshot();

    fireEvent.click(getByText('mock link content'));
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenLastCalledWith('https://example.com');

    fireEvent.click(baseElement.querySelector('.ant-modal-close'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockSetNotShowing).not.toHaveBeenCalled();

    const checkbox = baseElement.querySelector('.ant-checkbox');
    expect(checkbox).not.toHaveClass('ant-checkbox-checked');
    fireEvent.click(getByText("Don't show again"));
    expect(checkbox).toHaveClass('ant-checkbox-checked');
    fireEvent.click(baseElement.querySelector('.ant-modal-close'));
    expect(mockOnClose).toHaveBeenCalledTimes(2);
    expect(mockSetNotShowing).toHaveBeenCalledTimes(1);
    expect(mockSetNotShowing).toHaveBeenCalledWith(11);
  });

  it('should render correctly without button link', () => {
    const { baseElement, getByText } = render(
      <AnnouncementPanel announcement={{ ...mockAnnouncement, link: '' }} onClose={mockOnClose} />
    );
    expect(baseElement).toMatchSnapshot();

    const closeButton = getByText('Close');
    fireEvent.click(closeButton);
    expect(mockOpen).not.toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockSetNotShowing).not.toHaveBeenCalled();

    fireEvent.click(getByText("Don't show again"));
    expect(mockSetNotShowing).toHaveBeenCalledTimes(0);
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(2);
    expect(mockSetNotShowing).toHaveBeenCalledTimes(1);
    expect(mockSetNotShowing).toHaveBeenCalledWith(11);
  });
});
