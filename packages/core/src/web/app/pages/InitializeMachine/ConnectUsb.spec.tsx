import React from 'react';

import { fireEvent, render } from '@testing-library/react';

import ConnectUsb from './ConnectUsb';

const mockSearchParams = new URLSearchParams('model=ado1');
const mockSetSearchParams = jest.fn();
const mockUseSearchParams = jest.fn(() => [mockSearchParams, mockSetSearchParams]);

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useSearchParams: () => mockUseSearchParams(),
}));

describe('test ConnectUsb', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.location.hash = '';
  });

  test('should render correctly', () => {
    const { container } = render(<ConnectUsb />);

    expect(container).toMatchSnapshot();
  });

  test('should navigate to connect-machine-ip on Next click', () => {
    const { getByText } = render(<ConnectUsb />);

    fireEvent.click(getByText('Next'));
    expect(window.location.hash).toBe('#/initialize/connect/connect-machine-ip?model=ado1&usb=1');
  });

  test('should navigate back on Back click', () => {
    const mockHistoryBack = jest.fn();

    window.history.back = mockHistoryBack;

    const { getByText } = render(<ConnectUsb />);

    fireEvent.click(getByText('Back'));
    expect(mockHistoryBack).toHaveBeenCalledTimes(1);
  });

  describe('model-specific rendering', () => {
    test('should render ador-specific content', () => {
      const { getByText } = render(<ConnectUsb />);

      expect(getByText('Ador')).toBeInTheDocument();
      expect(getByText(/1\./)).toBeInTheDocument(); // Has steps
    });

    test('should render fhexa1-specific content', () => {
      mockUseSearchParams.mockReturnValueOnce([new URLSearchParams('model=fhexa1'), mockSetSearchParams]);

      const { getByText } = render(<ConnectUsb />);

      expect(getByText('HEXA')).toBeInTheDocument();
    });

    test('should render fpm1-specific content', () => {
      mockUseSearchParams.mockReturnValueOnce([new URLSearchParams('model=fpm1'), mockSetSearchParams]);

      const { getByText } = render(<ConnectUsb />);

      expect(getByText('Promark Series')).toBeInTheDocument();
    });

    test('should render fallback content for other usb models', () => {
      mockUseSearchParams.mockReturnValueOnce([new URLSearchParams('model=fbb2'), mockSetSearchParams]);

      const { getByText } = render(<ConnectUsb />);

      // Should use ador steps with label from workarea
      expect(getByText('Beambox II')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    test('should handle missing model parameter', () => {
      mockUseSearchParams.mockReturnValueOnce([new URLSearchParams(''), mockSetSearchParams]);

      const { container } = render(<ConnectUsb />);

      expect(container).toBeTruthy();
      // Component should still render without crashing
    });

    test('should handle invalid model parameter', () => {
      mockUseSearchParams.mockReturnValueOnce([new URLSearchParams('model=invalid'), mockSetSearchParams]);

      const { container } = render(<ConnectUsb />);

      expect(container).toBeTruthy();
      // Component should still render with fallback
    });
  });
});
