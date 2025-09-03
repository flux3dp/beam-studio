import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import GoogleFontsPanel from './GoogleFontsPanel';

// Mock the Google Fonts API response
const mockGoogleFontsResponse = {
  items: [
    {
      category: 'sans-serif',
      family: 'Roboto',
      files: {
        '400': 'http://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2',
      },
      subsets: ['latin', 'latin-ext'],
      variants: ['300', '400', '500', '700'],
    },
    {
      category: 'sans-serif',
      family: 'Open Sans',
      files: {
        '400':
          'http://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1x4gaVc.woff2',
      },
      subsets: ['latin', 'latin-ext'],
      variants: ['300', '400', '600', '700', '800'],
    },
  ],
};

// Mock fetch globally
global.fetch = jest.fn();

// Mock intersection observer
const mockIntersectionObserver = jest.fn();

mockIntersectionObserver.mockReturnValue({
  disconnect: jest.fn(),
  observe: jest.fn(),
  unobserve: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock document.createElement for link elements
const mockLinkElement = {
  href: '',
  rel: '',
};

// Store original createElement
const originalCreateElement = document.createElement;

beforeAll(() => {
  document.createElement = jest.fn().mockImplementation((tagName) => {
    if (tagName === 'link') {
      return mockLinkElement;
    }

    return originalCreateElement.call(document, tagName);
  });

  // Mock document.head.appendChild
  const mockAppendChild = jest.fn();

  Object.defineProperty(document, 'head', {
    configurable: true,
    value: { appendChild: mockAppendChild },
  });
});

afterAll(() => {
  document.createElement = originalCreateElement;
});

describe('GoogleFontsPanel API Integration Tests', () => {
  const mockOnClose = jest.fn();
  const mockOnFontSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      json: async () => mockGoogleFontsResponse,
      ok: true,
      status: 200,
    });
  });

  const defaultProps = {
    onClose: mockOnClose,
    onFontSelect: mockOnFontSelect,
    visible: true,
  };

  describe('Basic Rendering', () => {
    it('should render the modal when visible', () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      expect(screen.getByText('GoogleFonts')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search Fonts')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
    });

    it('should not render when not visible', () => {
      render(<GoogleFontsPanel {...defaultProps} visible={false} />);

      expect(screen.queryByText('GoogleFonts')).not.toBeInTheDocument();
    });
  });

  describe('Google Fonts API Integration', () => {
    it('should fetch fonts from Google Fonts API when modal opens', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('https://www.googleapis.com/webfonts/v1/webfonts'));
      });

      expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/key=.*&sort=popularity/));
    });

    it('should display fonts after successful API call', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roboto')).toBeInTheDocument();
        expect(screen.getByText('Open Sans')).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch Google Fonts:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });

    it('should validate API response structure', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      // Verify the API was called with correct parameters
      const fetchCall = (fetch as jest.Mock).mock.calls[0][0];

      expect(fetchCall).toContain('googleapis.com/webfonts');
      expect(fetchCall).toContain('sort=popularity');
      expect(fetchCall).toContain('key=');
    });
  });

  describe('Font Loading', () => {
    it('should load fonts on demand when Save is clicked', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roboto')).toBeInTheDocument();
      });

      const saveButton = screen.getAllByText('Save')[0];

      fireEvent.click(saveButton);

      expect(document.createElement).toHaveBeenCalledWith('link');
      expect(mockLinkElement.href).toContain('fonts.googleapis.com');
      expect(mockLinkElement.href).toContain('Roboto');
      expect(mockLinkElement.rel).toBe('stylesheet');
    });

    it('should call onFontSelect when font is selected', async () => {
      jest.useFakeTimers();
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roboto')).toBeInTheDocument();
      });

      const saveButton = screen.getAllByText('Save')[0];

      fireEvent.click(saveButton);

      // Fast-forward the 500ms delay
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockOnFontSelect).toHaveBeenCalledWith('Roboto');
      });

      jest.useRealTimers();
    });
  });

  describe('Search Functionality', () => {
    it('should filter fonts by search text', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roboto')).toBeInTheDocument();
        expect(screen.getByText('Open Sans')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search Fonts');

      fireEvent.change(searchInput, { target: { value: 'Roboto' } });

      // After filtering, only Roboto should be visible
      expect(screen.getByText('Roboto')).toBeInTheDocument();
      expect(screen.queryByText('Open Sans')).not.toBeInTheDocument();
    });

    it('should clear search results when search is cleared', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roboto')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search Fonts');

      // First filter
      fireEvent.change(searchInput, { target: { value: 'Roboto' } });
      expect(screen.queryByText('Open Sans')).not.toBeInTheDocument();

      // Then clear
      fireEvent.change(searchInput, { target: { value: '' } });
      expect(screen.getByText('Roboto')).toBeInTheDocument();
      expect(screen.getByText('Open Sans')).toBeInTheDocument();
    });
  });

  describe('Web Font Loading Integration', () => {
    it('should create valid Google Fonts URL for font loading', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roboto')).toBeInTheDocument();
      });

      const saveButton = screen.getAllByText('Save')[0];

      fireEvent.click(saveButton);

      expect(mockLinkElement.href).toMatch(
        /^https:\/\/fonts\.googleapis\.com\/css2\?family=Roboto:wght@400&display=swap$/,
      );
    });

    it('should handle fonts with spaces in name', async () => {
      // Mock response with font that has spaces
      (fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          items: [
            {
              category: 'sans-serif',
              family: 'Open Sans',
              files: { '400': 'opensans.woff2' },
              subsets: ['latin'],
              variants: ['400'],
            },
          ],
        }),
        ok: true,
        status: 200,
      });

      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Open Sans')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save');

      fireEvent.click(saveButton);

      expect(mockLinkElement.href).toContain('Open+Sans');
    });
  });

  describe('Performance Optimization', () => {
    it('should limit results to 100 fonts for performance', async () => {
      // Mock response with more than 100 fonts
      const largeFontList = Array.from({ length: 150 }, (_, i) => ({
        category: 'sans-serif',
        family: `Font ${i}`,
        files: { '400': 'test.woff2' },
        subsets: ['latin'],
        variants: ['400'],
      }));

      (fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ items: largeFontList }),
        ok: true,
        status: 200,
      });

      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        const fontItems = screen.getAllByText(/styles \|/);

        expect(fontItems.length).toBeLessThanOrEqual(100);
      });
    });

    it('should not fetch fonts again if already loaded', async () => {
      const { rerender } = render(<GoogleFontsPanel {...defaultProps} visible={false} />);

      // First render with visible=true should trigger fetch
      rerender(<GoogleFontsPanel {...defaultProps} visible={true} />);
      await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

      // Hide and show again - should not trigger another fetch
      rerender(<GoogleFontsPanel {...defaultProps} visible={false} />);
      rerender(<GoogleFontsPanel {...defaultProps} visible={true} />);

      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle malformed API response', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ invalid: 'response' }),
        ok: true,
        status: 200,
      });

      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        // Should not crash and should not show any fonts
        expect(screen.queryByText('Roboto')).not.toBeInTheDocument();
      });

      // Should still show the modal structure
      expect(screen.getByText('GoogleFonts')).toBeInTheDocument();
    });

    it('should handle empty API response', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        json: async () => ({ items: [] }),
        ok: true,
        status: 200,
      });

      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Roboto')).not.toBeInTheDocument();
      });

      expect(screen.getByText('GoogleFonts')).toBeInTheDocument();
    });

    it('should handle network timeouts', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      (fetch as jest.Mock).mockRejectedValue(new Error('Timeout'));

      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch Google Fonts:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
