import {
  getGoogleFont,
  getGoogleFontsCatalog,
  getGoogleFontsCatalogSorted,
  googleFontsApiCache,
  type GoogleFontsApiResponse,
} from './googleFontsApiCache';

// Mock fetch globally
global.fetch = jest.fn();

describe('GoogleFontsApiCache', () => {
  const mockApiResponse: GoogleFontsApiResponse = {
    items: [
      {
        category: 'sans-serif',
        family: 'Roboto',
        files: {
          '700':
            'https://fonts.gstatic.com/s/roboto/v49/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWuYjammTggvWl0Qn.ttf',
          regular:
            'https://fonts.gstatic.com/s/roboto/v49/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWubEbWmTggvWl0Qn.ttf',
        },
        kind: 'webfonts#webfont',
        lastModified: '2025-09-08',
        subsets: [
          'cyrillic',
          'cyrillic-ext',
          'greek',
          'greek-ext',
          'latin',
          'latin-ext',
          'math',
          'symbols',
          'vietnamese',
        ],
        variants: [
          '100',
          '200',
          '300',
          'regular',
          '500',
          '600',
          '700',
          '800',
          '900',
          '100italic',
          '200italic',
          '300italic',
          'italic',
          '500italic',
          '600italic',
          '700italic',
          '800italic',
          '900italic',
        ],
        version: 'v49',
      },
      {
        category: 'serif',
        family: 'Open Sans',
        files: {
          regular:
            'https://fonts.gstatic.com/s/opensans/v43/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0C4nY1M2xLER.ttf',
        },
        kind: 'webfonts#webfont',
        lastModified: '2023-01-15',
        subsets: ['latin', 'latin-ext', 'cyrillic'],
        variants: ['300', 'regular', '600', '700', '800'],
        version: 'v34',
      },
    ],
    kind: 'webfonts#webfontList',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    googleFontsApiCache.clearCache();
  });

  afterEach(() => {
    googleFontsApiCache.clearCache();
  });

  describe('Cache Management', () => {
    it('should start with empty cache', () => {
      const status = googleFontsApiCache.getCacheStatus();

      expect(status.cached).toBe(false);
      expect(status.itemCount).toBe(0);
      expect(status.sortedCached).toBe(false);
    });

    it('should cache API response on first call', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockApiResponse,
        ok: true,
        status: 200,
      });

      const result = await googleFontsApiCache.getCompleteCache();

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/https:\/\/www\.googleapis\.com\/webfonts\/v1\/webfonts.*key=.*&sort=popularity/),
      );
      expect(result).toEqual(mockApiResponse);

      const status = googleFontsApiCache.getCacheStatus();

      expect(status.cached).toBe(true);
      expect(status.itemCount).toBe(2);
    });

    it('should return cached data on subsequent calls without additional API requests', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockApiResponse,
        ok: true,
        status: 200,
      });

      // First call should trigger API
      const firstResult = await googleFontsApiCache.getCompleteCache();

      expect(fetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const secondResult = await googleFontsApiCache.getCompleteCache();

      expect(fetch).toHaveBeenCalledTimes(1); // Still only 1 call
      expect(secondResult).toEqual(firstResult);
      expect(secondResult).toBe(firstResult); // Same object reference
    });

    it('should handle concurrent requests without duplicate API calls', async () => {
      (fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  json: async () => mockApiResponse,
                  ok: true,
                  status: 200,
                }),
              100,
            ),
          ),
      );

      // Start multiple concurrent requests
      const promises = [
        googleFontsApiCache.getCompleteCache(),
        googleFontsApiCache.getCompleteCache(),
        googleFontsApiCache.getCompleteCache(),
      ];

      const results = await Promise.all(promises);

      expect(fetch).toHaveBeenCalledTimes(1); // Only one actual API call
      expect(results[0]).toEqual(mockApiResponse);
      expect(results[1]).toEqual(mockApiResponse);
      expect(results[2]).toEqual(mockApiResponse);
    });

    it('should clear cache when clearCache is called', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockApiResponse,
        ok: true,
        status: 200,
      });

      await googleFontsApiCache.getCompleteCache();
      expect(googleFontsApiCache.getCacheStatus().cached).toBe(true);

      googleFontsApiCache.clearCache();
      expect(googleFontsApiCache.getCacheStatus().cached).toBe(false);
      expect(googleFontsApiCache.getCacheStatus().itemCount).toBe(0);
    });
  });

  describe('Sorted Cache Management', () => {
    it('should create and cache sorted version', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockApiResponse,
        ok: true,
        status: 200,
      });

      const sortedResult = await googleFontsApiCache.getSortedCache();

      expect(sortedResult).toEqual(mockApiResponse);
      expect(sortedResult.items).toEqual(mockApiResponse.items);

      const status = googleFontsApiCache.getCacheStatus();

      expect(status.sortedCached).toBe(true);
    });

    it('should reuse sorted cache on subsequent calls', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockApiResponse,
        ok: true,
        status: 200,
      });

      const firstSorted = await googleFontsApiCache.getSortedCache();
      const secondSorted = await googleFontsApiCache.getSortedCache();

      expect(firstSorted).toBe(secondSorted); // Same object reference
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should clear sorted cache when clearCache is called', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockApiResponse,
        ok: true,
        status: 200,
      });

      await googleFontsApiCache.getSortedCache();
      expect(googleFontsApiCache.getCacheStatus().sortedCached).toBe(true);

      googleFontsApiCache.clearCache();
      expect(googleFontsApiCache.getCacheStatus().sortedCached).toBe(false);
    });
  });

  describe('Font Finding', () => {
    beforeEach(async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockApiResponse,
        ok: true,
        status: 200,
      });
      await googleFontsApiCache.getCompleteCache();
    });

    it('should find existing font by family name', async () => {
      const font = await googleFontsApiCache.findFont('Roboto');

      expect(font).toBeDefined();
      expect(font?.family).toBe('Roboto');
      expect(font?.category).toBe('sans-serif');
      expect(font?.variants).toContain('regular');
    });

    it('should return null for non-existent font', async () => {
      const font = await googleFontsApiCache.findFont('NonExistentFont');

      expect(font).toBeNull();
    });

    it('should be case-sensitive in font search', async () => {
      const font = await googleFontsApiCache.findFont('roboto'); // lowercase

      expect(font).toBeNull();
    });

    it('should find font with exact family name match', async () => {
      const font = await googleFontsApiCache.findFont('Open Sans');

      expect(font).toBeDefined();
      expect(font?.family).toBe('Open Sans');
      expect(font?.category).toBe('serif');
    });
  });

  describe('API Error Handling', () => {
    it('should handle network errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(googleFontsApiCache.getCompleteCache()).rejects.toThrow('Network error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Failed to fetch Google Fonts API:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it('should handle HTTP errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({}),
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(googleFontsApiCache.getCompleteCache()).rejects.toThrow(
        'Failed to fetch Google Fonts API: 500 Internal Server Error',
      );
    });

    it('should handle invalid API key error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ error: { message: 'API key not valid' } }),
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(googleFontsApiCache.getCompleteCache()).rejects.toThrow(
        'Google Fonts API key is invalid or expired. Please configure a valid API key.',
      );
    });

    it('should handle malformed JSON response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => {
          throw new Error('Invalid JSON');
        },
        ok: true,
        status: 200,
      });

      await expect(googleFontsApiCache.getCompleteCache()).rejects.toThrow('Invalid JSON');
    });

    it('should handle empty response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ items: [], kind: 'webfonts#webfontList' }),
        ok: true,
        status: 200,
      });

      const result = await googleFontsApiCache.getCompleteCache();

      expect(result.items).toEqual([]);
      expect(result.kind).toBe('webfonts#webfontList');
    });
  });

  describe('Console Logging', () => {
    it('should log successful cache operations', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockApiResponse,
        ok: true,
        status: 200,
      });

      await googleFontsApiCache.getCompleteCache();

      expect(consoleLogSpy).toHaveBeenCalledWith('🌐 Fetching Google Fonts API (with caching)...');
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Google Fonts API cached successfully (2 fonts)');

      consoleLogSpy.mockRestore();
    });

    it('should log cache clearing', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      googleFontsApiCache.clearCache();

      expect(consoleLogSpy).toHaveBeenCalledWith('🗑️ Google Fonts API cache cleared');

      consoleLogSpy.mockRestore();
    });
  });
});

describe('Convenience Functions', () => {
  const mockApiResponse: GoogleFontsApiResponse = {
    items: [
      {
        category: 'sans-serif',
        family: 'Roboto',
        files: { '400': 'roboto.woff2' },
        kind: 'webfonts#webfont',
        lastModified: '2022-09-22',
        subsets: ['latin'],
        variants: ['400'],
        version: 'v30',
      },
    ],
    kind: 'webfonts#webfontList',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    googleFontsApiCache.clearCache();
  });

  afterEach(() => {
    googleFontsApiCache.clearCache();
  });

  describe('getGoogleFont', () => {
    it('should find font using convenience function', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockApiResponse,
        ok: true,
        status: 200,
      });

      const font = await getGoogleFont('Roboto');

      expect(font).toBeDefined();
      expect(font?.family).toBe('Roboto');
    });

    it('should return null for non-existent font using convenience function', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockApiResponse,
        ok: true,
        status: 200,
      });

      const font = await getGoogleFont('NonExistentFont');

      expect(font).toBeNull();
    });
  });

  describe('getGoogleFontsCatalog', () => {
    it('should return complete catalog using convenience function', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockApiResponse,
        ok: true,
        status: 200,
      });

      const catalog = await getGoogleFontsCatalog();

      expect(catalog).toEqual(mockApiResponse);
      expect(catalog.items).toHaveLength(1);
    });
  });

  describe('getGoogleFontsCatalogSorted', () => {
    it('should return sorted catalog using convenience function', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockApiResponse,
        ok: true,
        status: 200,
      });

      const sortedCatalog = await getGoogleFontsCatalogSorted();

      expect(sortedCatalog).toEqual(mockApiResponse);
      expect(sortedCatalog.items).toHaveLength(1);
    });
  });
});
