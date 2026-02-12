import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import ConnectWired from './ConnectWired';

const mockSearchParams = new URLSearchParams('model=ado1');
const mockSetSearchParams = jest.fn();
const mockUseSearchParams = jest.fn(() => [mockSearchParams, mockSetSearchParams]);

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useSearchParams: () => mockUseSearchParams(),
}));

jest.mock('@core/helpers/useI18n', () => () => ({
  initialize: {
    back: 'Back',
    connect_wired: {
      title: 'Connecting to Wired Network',
      tutorial1: '1. Connect the machine with your router.',
      tutorial2: '2. Press "Network" to get the wired network IP.',
      tutorial2_ador: 'tutorial2',
      what_if_1: 'What if the IP is empty?',
      what_if_1_content: 'what_if_1_content',
      what_if_2: 'What if the IP starts with 169?',
      what_if_2_content: 'what_if_2_content',
    },
    next: 'Next',
  },
}));

describe('test ConnectWired', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.location.hash = '';
  });

  it('should render correctly', () => {
    const { container } = render(<ConnectWired />);

    expect(container).toMatchSnapshot();
  });

  test('should navigate to connect-machine-ip on Next click', () => {
    const { getByText } = render(<ConnectWired />);

    fireEvent.click(getByText('Next'));
    expect(window.location.hash).toBe('#/initialize/connect/connect-machine-ip?model=ado1&wired=1');
  });

  test('should navigate back on Back click', () => {
    const mockHistoryBack = jest.fn();

    window.history.back = mockHistoryBack;

    const { getByText } = render(<ConnectWired />);

    fireEvent.click(getByText('Back'));
    expect(mockHistoryBack).toHaveBeenCalledTimes(1);
  });

  describe('model-specific rendering', () => {
    test('should render ador-specific content', () => {
      const { getByText } = render(<ConnectWired />);

      expect(getByText('tutorial2')).toBeInTheDocument();
    });

    test('should render nx-specific image', () => {
      mockUseSearchParams.mockReturnValueOnce([new URLSearchParams('model=fbb2'), mockSetSearchParams]);

      const { container } = render(<ConnectWired />);
      const img = container.querySelector('img');

      expect(img?.src).toContain('beambox-2-panel.png');
    });

    test('should render standard image for other models', () => {
      mockUseSearchParams.mockReturnValueOnce([new URLSearchParams('model=fbm1'), mockSetSearchParams]);

      const { container } = render(<ConnectWired />);
      const img = container.querySelector('img');

      expect(img?.src).toContain('touch-panel-en.jpg');
    });
  });

  describe('edge cases', () => {
    test('should handle missing model parameter', () => {
      mockUseSearchParams.mockReturnValueOnce([new URLSearchParams(''), mockSetSearchParams]);

      const { container } = render(<ConnectWired />);

      expect(container).toBeTruthy();
      // Component should still render without crashing
    });

    test('should handle invalid model parameter', () => {
      mockUseSearchParams.mockReturnValueOnce([new URLSearchParams('model=invalid'), mockSetSearchParams]);

      const { container } = render(<ConnectWired />);

      expect(container).toBeTruthy();
      // Component should still render with fallback
    });
  });
});
