import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import ConnectWifi from './ConnectWiFi';

jest.mock('@core/helpers/useI18n', () => () => ({
  initialize: {
    back: 'Back',
    connect_wifi: {
      title: 'Connecting to Wi-Fi',
      tutorial1: '1. Go to Touch Panel > Click "Network" > "Connect to WiFi".',
      tutorial1_ador: 'tutorial1',
      tutorial2: '2. Select and connect your preferred Wi-Fi.',
      what_if_1: "What if I don't see my Wi-Fi?",
      what_if_1_content: 'what_if_1_content',
      what_if_2: "What if I don't see any Wi-Fi?",
      what_if_2_content: 'what_if_2_content',
    },
    next: 'Next',
  },
}));

const mockSearchParams = new URLSearchParams('model=ado1');
const mockSetSearchParams = jest.fn();
const mockUseSearchParams = jest.fn(() => [mockSearchParams, mockSetSearchParams]);

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useSearchParams: () => mockUseSearchParams(),
}));

describe('test ConnectWiFi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.location.hash = '';
  });

  test('should render correctly', () => {
    const { container } = render(<ConnectWifi />);

    expect(container).toMatchSnapshot();
  });

  test('should navigate to connect-machine-ip on Next click', () => {
    const { getByText } = render(<ConnectWifi />);

    fireEvent.click(getByText('Next'));
    expect(window.location.hash).toBe('#/initialize/connect/connect-machine-ip?model=ado1&wired=0');
  });

  test('should navigate back on Back click', () => {
    const mockHistoryBack = jest.fn();

    window.history.back = mockHistoryBack;

    const { getByText } = render(<ConnectWifi />);

    fireEvent.click(getByText('Back'));
    expect(mockHistoryBack).toHaveBeenCalledTimes(1);
  });

  describe('model-specific rendering', () => {
    test('should render ador-specific content', () => {
      const { getByText } = render(<ConnectWifi />);

      expect(getByText('tutorial1')).toBeInTheDocument();
    });

    test('should render nx-specific image', () => {
      mockUseSearchParams.mockReturnValueOnce([new URLSearchParams('model=fbb2'), mockSetSearchParams]);

      const { container } = render(<ConnectWifi />);
      const img = container.querySelector('img');

      expect(img?.src).toContain('beambox-2-panel.png');
    });

    test('should render standard image for other models', () => {
      mockUseSearchParams.mockReturnValueOnce([new URLSearchParams('model=fbm1'), mockSetSearchParams]);

      const { container } = render(<ConnectWifi />);
      const img = container.querySelector('img');

      expect(img?.src).toContain('touch-panel-en.jpg');
    });
  });

  describe('edge cases', () => {
    test('should handle missing model parameter', () => {
      mockUseSearchParams.mockReturnValueOnce([new URLSearchParams(''), mockSetSearchParams]);

      const { container } = render(<ConnectWifi />);

      expect(container).toBeTruthy();
      // Component should still render without crashing
    });

    test('should handle invalid model parameter', () => {
      mockUseSearchParams.mockReturnValueOnce([new URLSearchParams('model=invalid'), mockSetSearchParams]);

      const { container } = render(<ConnectWifi />);

      expect(container).toBeTruthy();
      // Component should still render with fallback
    });
  });
});
