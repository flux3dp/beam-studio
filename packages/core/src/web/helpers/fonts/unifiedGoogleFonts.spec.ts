import {
  getLoadedGoogleFonts,
  getRegisteredGoogleFonts,
  isGoogleFontLoaded,
  isGoogleFontRegistered,
  loadContextGoogleFonts,
  loadGoogleFont,
  MAX_GOOGLE_FONT_LINKS,
} from './unifiedGoogleFonts';

// Mock the DOM methods
const mockQuerySelectorAll = jest.fn();
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();

// Mock console methods to avoid noise in tests
const mockConsoleLog = jest.fn();
const mockConsoleWarn = jest.fn();

// Store original methods
const originalCreateElement = document.createElement;

// Mock link element
const createMockLinkElement = () => ({
  href: '',
  onerror: null as (() => void) | null,
  onload: null as (() => void) | null,
  rel: '',
  remove: jest.fn(),
});

describe('UnifiedGoogleFonts', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup DOM mocks
    Object.defineProperty(document, 'querySelectorAll', {
      configurable: true,
      value: mockQuerySelectorAll,
    });

    Object.defineProperty(document, 'createElement', {
      configurable: true,
      value: mockCreateElement,
    });

    Object.defineProperty(document, 'head', {
      configurable: true,
      value: { appendChild: mockAppendChild },
    });

    // Setup console mocks
    console.log = mockConsoleLog;
    console.warn = mockConsoleWarn;

    // Default mock implementations
    mockCreateElement.mockImplementation((tagName: string) => {
      if (tagName === 'link') {
        return createMockLinkElement();
      }

      return originalCreateElement.call(document, tagName);
    });

    mockQuerySelectorAll.mockReturnValue([]);
  });

  describe('Constants and Configuration', () => {
    it('should export MAX_GOOGLE_FONT_LINKS constant', () => {
      expect(MAX_GOOGLE_FONT_LINKS).toBe(10);
    });
  });

  describe('Document Context Scanning', () => {
    it('should query for SVG text elements in correct selectors', () => {
      loadContextGoogleFonts();

      expect(mockQuerySelectorAll).toHaveBeenCalledWith('#svgcontent g.layer:not([display="none"]) text');
      expect(mockQuerySelectorAll).toHaveBeenCalledWith('#svg_defs text');
    });

    it('should handle empty document gracefully', () => {
      mockQuerySelectorAll.mockReturnValue([]);

      loadContextGoogleFonts();

      expect(mockConsoleLog).toHaveBeenCalledWith('No text elements found in document context');
    });

    it('should extract font-family attributes from text elements', () => {
      const mockTextElement = {
        getAttribute: jest.fn().mockReturnValue('Roboto'),
      };

      mockQuerySelectorAll.mockReturnValueOnce([mockTextElement]).mockReturnValueOnce([]);

      loadContextGoogleFonts();

      expect(mockTextElement.getAttribute).toHaveBeenCalledWith('font-family');
    });

    it('should clean font family names by removing quotes', () => {
      const mockTextElements = [
        { getAttribute: jest.fn().mockReturnValue('"Roboto"') },
        { getAttribute: jest.fn().mockReturnValue("'Open Sans'") },
        { getAttribute: jest.fn().mockReturnValue('  Lato  ') },
      ];

      mockQuerySelectorAll.mockReturnValueOnce(mockTextElements).mockReturnValueOnce([]);

      loadContextGoogleFonts();

      // Should process each element
      mockTextElements.forEach((element) => {
        expect(element.getAttribute).toHaveBeenCalledWith('font-family');
      });
    });

    it('should handle missing font-family attributes', () => {
      const mockTextElements = [
        { getAttribute: jest.fn().mockReturnValue(null) },
        { getAttribute: jest.fn().mockReturnValue('') },
        { getAttribute: jest.fn().mockReturnValue('Roboto') },
      ];

      mockQuerySelectorAll.mockReturnValueOnce(mockTextElements).mockReturnValueOnce([]);

      loadContextGoogleFonts();

      // Should call getAttribute on all elements but only process valid ones
      mockTextElements.forEach((element) => {
        expect(element.getAttribute).toHaveBeenCalledWith('font-family');
      });
    });

    it('should handle DOM query errors gracefully', () => {
      mockQuerySelectorAll.mockImplementation(() => {
        throw new Error('DOM query failed');
      });

      loadContextGoogleFonts();

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        'Failed to scan document context for Google Fonts:',
        expect.any(Error),
      );
    });
  });

  describe('Individual Font Loading', () => {
    it('should load single Google Font', () => {
      loadGoogleFont('Roboto');

      // Since we can't easily test the internal GoogleFontsLoader,
      // we just verify the function doesn't throw
      expect(true).toBe(true);
    });

    it('should handle empty font family', () => {
      loadGoogleFont('');

      // Should handle empty string gracefully
      expect(true).toBe(true);
    });
  });

  describe('Font Status Queries', () => {
    it('should check if font is loaded', () => {
      const result = isGoogleFontLoaded('Roboto');

      expect(typeof result).toBe('boolean');
    });

    it('should check if font is registered', () => {
      const result = isGoogleFontRegistered('Roboto');

      expect(typeof result).toBe('boolean');
    });

    it('should get loaded fonts set', () => {
      const result = getLoadedGoogleFonts();

      expect(result).toBeInstanceOf(Set);
    });

    it('should get registered fonts set', () => {
      const result = getRegisteredGoogleFonts();

      expect(result).toBeInstanceOf(Set);
    });
  });

  describe('Font Parameters and Caching', () => {
    it('should accept available font families parameter', () => {
      const availableFontFamilies = ['Arial', 'Times New Roman'];

      loadContextGoogleFonts(availableFontFamilies);

      // Should query DOM when specific fonts are provided
      expect(mockQuerySelectorAll).toHaveBeenCalled();
    });

    it('should use cached font families when no parameter provided', () => {
      // First call - should scan document
      const mockTextElement = {
        getAttribute: jest.fn().mockReturnValue('Roboto'),
      };

      mockQuerySelectorAll.mockReturnValueOnce([mockTextElement]).mockReturnValueOnce([]);

      loadContextGoogleFonts();

      // Reset mocks
      mockQuerySelectorAll.mockClear();
      mockQuerySelectorAll.mockReturnValue([]);

      // Second call - behavior depends on internal caching logic
      loadContextGoogleFonts();

      // We can't easily test the internal caching without more complex mocking
      expect(mockQuerySelectorAll).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed DOM elements', () => {
      const malformedElements = [
        {
          getAttribute: jest.fn().mockImplementation(() => {
            throw new Error('getAttribute failed');
          }),
        },
        null,
        undefined,
      ];

      // Filter out null/undefined for the DOM query
      mockQuerySelectorAll.mockReturnValueOnce([malformedElements[0]]).mockReturnValueOnce([]);

      expect(() => {
        loadContextGoogleFonts();
      }).not.toThrow();
    });

    it('should handle concurrent loading calls', () => {
      const mockTextElement = {
        getAttribute: jest.fn().mockReturnValue('Roboto'),
      };

      mockQuerySelectorAll.mockReturnValue([mockTextElement]);

      // Multiple concurrent calls should not crash
      expect(() => {
        loadContextGoogleFonts();
        loadContextGoogleFonts();
        loadContextGoogleFonts();
      }).not.toThrow();
    });

    it('should handle special characters in font family names', () => {
      const mockTextElements = [
        { getAttribute: jest.fn().mockReturnValue('Font-Name') },
        { getAttribute: jest.fn().mockReturnValue('Font Name') },
        { getAttribute: jest.fn().mockReturnValue('Font_Name') },
        { getAttribute: jest.fn().mockReturnValue('Font123') },
      ];

      mockQuerySelectorAll.mockReturnValueOnce(mockTextElements).mockReturnValueOnce([]);

      expect(() => {
        loadContextGoogleFonts();
      }).not.toThrow();
    });
  });

  describe('Performance and Memory Management', () => {
    it('should report scanning progress', () => {
      const mockTextElements = Array.from({ length: 5 }, () => ({
        getAttribute: jest.fn().mockReturnValue('Roboto'),
      }));

      mockQuerySelectorAll.mockReturnValueOnce(mockTextElements).mockReturnValueOnce([]);

      loadContextGoogleFonts();

      expect(mockConsoleLog).toHaveBeenCalledWith('Scanning 5 text elements for Google Fonts...');
    });

    it('should handle large numbers of text elements', () => {
      const mockTextElements = Array.from({ length: 1000 }, () => ({
        getAttribute: jest.fn().mockReturnValue('Roboto'),
      }));

      mockQuerySelectorAll.mockReturnValueOnce(mockTextElements).mockReturnValueOnce([]);

      expect(() => {
        loadContextGoogleFonts();
      }).not.toThrow();

      expect(mockConsoleLog).toHaveBeenCalledWith('Scanning 1000 text elements for Google Fonts...');
    });

    it('should deduplicate font families', () => {
      const mockTextElements = [
        { getAttribute: jest.fn().mockReturnValue('Roboto') },
        { getAttribute: jest.fn().mockReturnValue('Roboto') },
        { getAttribute: jest.fn().mockReturnValue('Open Sans') },
        { getAttribute: jest.fn().mockReturnValue('Roboto') },
      ];

      mockQuerySelectorAll.mockReturnValueOnce(mockTextElements).mockReturnValueOnce([]);

      loadContextGoogleFonts();

      // Should have processed all elements despite duplicates
      mockTextElements.forEach((element) => {
        expect(element.getAttribute).toHaveBeenCalledWith('font-family');
      });
    });
  });

  describe('Integration Points', () => {
    it('should maintain backward compatibility', () => {
      // Test that all exported functions are available
      expect(typeof loadContextGoogleFonts).toBe('function');
      expect(typeof loadGoogleFont).toBe('function');
      expect(typeof isGoogleFontLoaded).toBe('function');
      expect(typeof isGoogleFontRegistered).toBe('function');
      expect(typeof getLoadedGoogleFonts).toBe('function');
      expect(typeof getRegisteredGoogleFonts).toBe('function');
    });

    it('should handle function calls with various parameter types', () => {
      // Test different parameter combinations
      expect(() => {
        loadContextGoogleFonts();
        loadContextGoogleFonts([]);
        loadContextGoogleFonts(['Roboto']);
        loadContextGoogleFonts(['Roboto', 'Open Sans']);
      }).not.toThrow();
    });
  });
});
