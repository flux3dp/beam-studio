import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import type { IAnnouncement } from '@core/interfaces/IAnnouncement';

import AnnouncementPanel from './AnnouncementPanel';

const mockAnnouncement: IAnnouncement = {
  content: 'mock content',
  id: 11,
  link: 'https://example.com',
  link_text: 'mock link content',
  title: 'mock title',
};

jest.mock('@core/helpers/useI18n', () => () => ({
  alert: {
    close: 'Close',
    learn_more: 'Learn More',
  },
  beambox: {
    announcement_panel: {
      dont_show_again: "Don't show again",
      title: 'Announcement',
    },
  },
}));

const mockOpen = jest.fn();

jest.mock('@app/implementations/browser', () => ({
  open: (...args) => mockOpen(...args),
}));

const mockSetNotShowing = jest.fn();

jest.mock('@core/helpers/announcement-helper', () => ({
  setNotShowing: (...args) => mockSetNotShowing(...args),
}));

const mockOnClose = jest.fn();

describe('test AnnouncementPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const { baseElement, getByText } = render(
      <AnnouncementPanel announcement={mockAnnouncement} onClose={mockOnClose} />,
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
      <AnnouncementPanel announcement={{ ...mockAnnouncement, link: '' }} onClose={mockOnClose} />,
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
