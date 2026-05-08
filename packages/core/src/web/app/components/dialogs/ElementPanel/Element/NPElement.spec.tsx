import React, { act } from 'react';

import { fireEvent, render, waitFor } from '@testing-library/react';

const mockAddToHistory = jest.fn();
const mockOnClose = jest.fn();
const mockOnElementSelect = jest.fn();

jest.mock('@core/app/contexts/ElementPanelContext', () => ({
  ElementPanelContext: React.createContext({
    addToHistory: mockAddToHistory,
    onClose: mockOnClose,
    onElementSelect: mockOnElementSelect,
  }),
}));

jest.mock('@core/helpers/web-need-connection-helper', () => (callback) => callback());

import NPElement from './NPElement';

describe('test NPElement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', async () => {
    const { container } = render(<NPElement icon={{ id: '1234', thumbnail_url: 'img_thumbnail_url' }} />);

    expect(container).toMatchSnapshot();

    const icon = container.querySelector('.icon')!;
    const img = container.querySelector('img')!;

    fireEvent.click(icon);
    expect(mockAddToHistory).not.toHaveBeenCalled();

    fireEvent.load(img);
    expect(container).toMatchSnapshot();

    await act(async () => {
      fireEvent.click(icon);
    });
    await waitFor(() => {
      expect(mockAddToHistory).toHaveBeenCalled();
      expect(mockAddToHistory).toHaveBeenCalledWith({
        npIcon: { id: '1234', thumbnail_url: 'img_thumbnail_url' },
        type: 'np',
      });
      expect(mockOnElementSelect).toHaveBeenCalledWith('np/1234');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should render null when set hidden', async () => {
    const { container } = render(<NPElement icon={{ hidden: true, id: '1234', thumbnail_url: 'img_thumbnail_url' }} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('should render null when img error', async () => {
    const { container } = render(<NPElement icon={{ id: '1234', thumbnail_url: 'img_thumbnail_url' }} />);
    const img = container.querySelector('img')!;

    fireEvent.error(img);
    expect(container).toBeEmptyDOMElement();
  });
});
