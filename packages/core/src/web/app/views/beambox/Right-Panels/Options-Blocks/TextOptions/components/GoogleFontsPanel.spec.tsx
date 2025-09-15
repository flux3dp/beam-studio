import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import GoogleFontsPanel from './GoogleFontsPanel';

// Mock the Google Fonts API cache module
jest.mock('@core/helpers/fonts/googleFontsApiCache');

import * as googleFontsApiCache from '@core/helpers/fonts/googleFontsApiCache';

// Mock Google Fonts API response structure
const mockGoogleFontsResponse = {
  items: [
    {
      category: 'sans-serif',
      family: 'Roboto',
      files: {
        '400': 'http://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2',
        '700': 'http://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.woff2',
      },
      kind: 'webfonts#webfont',
      lastModified: '2022-09-22',
      subsets: ['latin', 'latin-ext'],
      variants: ['300', '400', '500', '700'],
      version: 'v30',
    },
    {
      category: 'serif',
      family: 'Open Sans',
      files: {
        '400':
          'http://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1x4gaVc.woff2',
        '600': 'http://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsgAx44.woff2',
      },
      kind: 'webfonts#webfont',
      lastModified: '2023-01-15',
      subsets: ['latin', 'latin-ext', 'cyrillic'],
      variants: ['300', '400', '600', '700', '800'],
      version: 'v34',
    },
    {
      category: 'display',
      family: 'Icons Font',
      files: {
        '400': 'http://fonts.gstatic.com/s/icons/v1/icons.woff2',
      },
      kind: 'webfonts#webfont',
      lastModified: '2023-01-01',
      subsets: ['latin'],
      variants: ['400'],
      version: 'v1',
    },
  ],
  kind: 'webfonts#webfontList',
};

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
  onerror: null as (() => void) | null,
  onload: null as (() => void) | null,
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

describe('GoogleFontsPanel Integration Tests', () => {
  const mockOnClose = jest.fn();
  const mockOnFontSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the cached API response
    (googleFontsApiCache.getGoogleFontsCatalogSorted as jest.Mock).mockResolvedValue(mockGoogleFontsResponse);
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
      expect(screen.getAllByText('Category')).toHaveLength(2); // Label and placeholder
    });

    it('should not render when not visible', () => {
      render(<GoogleFontsPanel {...defaultProps} visible={false} />);

      expect(screen.queryByText('GoogleFonts')).not.toBeInTheDocument();
    });
  });

  describe('Google Fonts API Cache Integration', () => {
    it('should use cached Google Fonts API data when modal opens', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(googleFontsApiCache.getGoogleFontsCatalogSorted).toHaveBeenCalledTimes(1);
      });

      // Should not call the old fetch API directly
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should display fonts from cached API data', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roboto')).toBeInTheDocument();
        expect(screen.getByText('Open Sans')).toBeInTheDocument();
      });
    });

    it('should handle cache API errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      (googleFontsApiCache.getGoogleFontsCatalogSorted as jest.Mock).mockRejectedValue(new Error('Cache error'));

      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch Google Fonts:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });

    it('should validate cached API response structure', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(googleFontsApiCache.getGoogleFontsCatalogSorted).toHaveBeenCalled();
      });

      // Verify no direct API calls were made
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Font Selection and Loading', () => {
    it('should load fonts on demand when font preview is clicked', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roboto')).toBeInTheDocument();
      });

      // Click on the font preview to select it
      const fontPreview = screen.getByText('Roboto').closest('[role="button"]');

      fireEvent.click(fontPreview!);

      expect(document.createElement).toHaveBeenCalledWith('link');
      expect(mockLinkElement.href).toContain('fonts.googleapis.com');
      expect(mockLinkElement.href).toContain('Roboto');
      expect(mockLinkElement.rel).toBe('stylesheet');
    });

    it('should show selected state when font preview is clicked', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roboto')).toBeInTheDocument();
      });

      // Click on the font preview to select it
      const fontPreview = screen.getByText('Roboto').closest('[role="button"]');

      fireEvent.click(fontPreview!);

      // Check that the font preview has the selected class
      expect(fontPreview).toHaveClass('selected');
    });

    it('should call onFontSelect when save button is clicked after font selection', async () => {
      jest.useFakeTimers();
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roboto')).toBeInTheDocument();
      });

      // First click on the font preview to select it
      const fontPreview = screen.getByText('Roboto').closest('[role="button"]');

      fireEvent.click(fontPreview!);

      // Then click the save button in the footer
      const saveButton = screen.getByRole('button', { name: 'Save' });

      fireEvent.click(saveButton);

      // Fast-forward the 500ms delay
      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockOnFontSelect).toHaveBeenCalledWith('Roboto');
      });

      jest.useRealTimers();
    });

    it('should enable save button only when a font is selected', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roboto')).toBeInTheDocument();
      });

      // Save button should be disabled initially
      const saveButton = screen.getByRole('button', { name: 'Save' });

      expect(saveButton).toBeDisabled();

      // Click on the font preview to select it
      const fontPreview = screen.getByText('Roboto').closest('[role="button"]');

      fireEvent.click(fontPreview!);

      // Save button should now be enabled
      expect(saveButton).toBeEnabled();
    });

    it('should allow switching between different font selections', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roboto')).toBeInTheDocument();
        expect(screen.getByText('Open Sans')).toBeInTheDocument();
      });

      // Select first font
      const robotoPreview = screen.getByText('Roboto').closest('[role="button"]');

      fireEvent.click(robotoPreview!);
      expect(robotoPreview).toHaveClass('selected');

      // Select second font - first should be deselected
      const openSansPreview = screen.getByText('Open Sans').closest('[role="button"]');

      fireEvent.click(openSansPreview!);
      expect(openSansPreview).toHaveClass('selected');
      expect(robotoPreview).not.toHaveClass('selected');
    });
  });

  describe('Search and Filtering Functionality', () => {
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

    it('should have category filter available', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roboto')).toBeInTheDocument();
        expect(screen.getByText('Open Sans')).toBeInTheDocument();
      });

      // Should show category filter label and placeholder
      expect(screen.getAllByText('Category')).toHaveLength(2);

      // Should show language filter label and placeholder
      expect(screen.getAllByText('Language')).toHaveLength(2);
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

    it('should filter out icon fonts by default', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roboto')).toBeInTheDocument();
        expect(screen.getByText('Open Sans')).toBeInTheDocument();
      });

      // Icon fonts should be filtered out
      expect(screen.queryByText('Icons Font')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should support keyboard navigation for font selection', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roboto')).toBeInTheDocument();
      });

      const fontPreview = screen.getByText('Roboto').closest('[role="button"]');

      // Test Enter key
      fireEvent.keyDown(fontPreview!, { code: 'Enter', key: 'Enter' });
      expect(fontPreview).toHaveClass('selected');

      // Reset selection
      const anotherFont = screen.getByText('Open Sans').closest('[role="button"]');

      fireEvent.click(anotherFont!);

      // Test Space key
      fireEvent.keyDown(fontPreview!, { code: 'Space', key: ' ' });
      expect(fontPreview).toHaveClass('selected');
    });

    it('should have proper ARIA attributes for accessibility', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roboto')).toBeInTheDocument();
      });

      const fontPreview = screen.getByText('Roboto').closest('[role="button"]');

      expect(fontPreview).toHaveAttribute('role', 'button');
      expect(fontPreview).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Web Font Loading Integration', () => {
    it('should create valid Google Fonts URL for font loading', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roboto')).toBeInTheDocument();
      });

      // Click on font preview first to select it
      const fontPreview = screen.getByText('Roboto').closest('[role="button"]');

      fireEvent.click(fontPreview!);

      const saveButton = screen.getByRole('button', { name: 'Save' });

      fireEvent.click(saveButton);

      expect(mockLinkElement.href).toMatch(
        /^https:\/\/fonts\.googleapis\.com\/css2\?family=Roboto:wght@400&display=swap$/,
      );
    });

    it('should handle fonts with spaces in name', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Open Sans')).toBeInTheDocument();
      });

      // Click on font preview first to select it
      const fontPreview = screen.getByText('Open Sans').closest('[role="button"]');

      fireEvent.click(fontPreview!);

      const saveButton = screen.getByRole('button', { name: 'Save' });

      fireEvent.click(saveButton);

      expect(mockLinkElement.href).toContain('Open+Sans');
    });

    it('should handle multiple font weights correctly', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roboto')).toBeInTheDocument();
      });

      const fontPreview = screen.getByText('Roboto').closest('[role="button"]');

      fireEvent.click(fontPreview!);

      const saveButton = screen.getByRole('button', { name: 'Save' });

      fireEvent.click(saveButton);

      // Should load with available weights
      expect(mockLinkElement.href).toMatch(/wght@\d+/);
    });
  });

  describe('Performance Optimization', () => {
    it('should limit results to 100 fonts for performance', async () => {
      // Mock response with more than 100 fonts
      const largeFontList = Array.from({ length: 150 }, (_, i) => ({
        category: 'sans-serif',
        family: `Font ${i}`,
        files: { '400': 'test.woff2' },
        kind: 'webfonts#webfont',
        lastModified: '2023-01-01',
        subsets: ['latin'],
        variants: ['400'],
        version: 'v1',
      }));

      (googleFontsApiCache.getGoogleFontsCatalogSorted as jest.Mock).mockResolvedValue({
        items: largeFontList,
        kind: 'webfonts#webfontList',
      });

      render(<GoogleFontsPanel {...defaultProps} />);

      // Wait for fonts to load and count font previews by looking for font names
      await waitFor(() => {
        expect(screen.getByText('Font 0')).toBeInTheDocument();
      });

      const fontItems = screen.getAllByText(/Font \d+/);

      expect(fontItems.length).toBeLessThanOrEqual(100);
    });

    it('should use cached data and not refetch on re-render', async () => {
      const { rerender } = render(<GoogleFontsPanel {...defaultProps} visible={false} />);

      // First render with visible=true should trigger cache fetch
      rerender(<GoogleFontsPanel {...defaultProps} visible={true} />);
      await waitFor(() => expect(googleFontsApiCache.getGoogleFontsCatalogSorted).toHaveBeenCalledTimes(1));

      // Hide and show again - should not trigger another cache fetch due to internal caching
      rerender(<GoogleFontsPanel {...defaultProps} visible={false} />);
      rerender(<GoogleFontsPanel {...defaultProps} visible={true} />);

      // Should still only be called once due to component-level caching
      expect(googleFontsApiCache.getGoogleFontsCatalogSorted).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle malformed cache response', async () => {
      (googleFontsApiCache.getGoogleFontsCatalogSorted as jest.Mock).mockResolvedValue({
        invalid: 'response',
      });

      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        // Should not crash and should not show any fonts
        expect(screen.queryByText('Roboto')).not.toBeInTheDocument();
      });

      // Should still show the modal structure
      expect(screen.getByText('GoogleFonts')).toBeInTheDocument();
    });

    it('should handle empty cache response', async () => {
      (googleFontsApiCache.getGoogleFontsCatalogSorted as jest.Mock).mockResolvedValue({
        items: [],
        kind: 'webfonts#webfontList',
      });

      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Roboto')).not.toBeInTheDocument();
      });

      expect(screen.getByText('GoogleFonts')).toBeInTheDocument();
    });

    it('should handle cache service unavailable', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      (googleFontsApiCache.getGoogleFontsCatalogSorted as jest.Mock).mockRejectedValue(
        new Error('Service unavailable'),
      );

      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch Google Fonts:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Cache Integration Benefits', () => {
    it('should benefit from centralized caching', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(googleFontsApiCache.getGoogleFontsCatalogSorted).toHaveBeenCalledTimes(1);
      });

      // Verify it uses the cached API system
      expect(googleFontsApiCache.getGoogleFontsCatalogSorted).toHaveBeenCalled();

      // Verify it doesn't make direct API calls
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle sorted font catalog', async () => {
      render(<GoogleFontsPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Roboto')).toBeInTheDocument();
        expect(screen.getByText('Open Sans')).toBeInTheDocument();
      });

      // Fonts should be rendered in the order returned by the sorted cache
      const fontElements = screen.getAllByText(/^(Roboto|Open Sans)$/);

      expect(fontElements.length).toBe(2);
    });
  });
});
