import {
  googleFontsApiCache,
  type GoogleFontsApiResponse,
} from './googleFontsApiCache';

// Mock fetch globally
global.fetch = jest.fn();

// Mock the FLUXID_HOST import to avoid dependency chain issues
jest.mock('../api/flux-id', () => ({
  FLUXID_HOST: 'https://id.flux3dp.com',
}));

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
        } as any,
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

  describe('Cache Management', () => {
    it('should start with empty cache', () => {
      const status = googleFontsApiCache.getCacheStatus();

      expect(status.cached).toBe(false);
      expect(status.itemCount).toBe(0);
    });

    it('should cache API response on first call', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockApiResponse,
        ok: true,
        status: 200,
      });

      const result = await googleFontsApiCache.getCache();

      expect(fetch).toHaveBeenCalledTimes(1);

      // Check the URL object is constructed correctly
      const [[actualUrl, options]] = (fetch as jest.Mock).mock.calls;

      expect(actualUrl.toString()).toBe('https://id.flux3dp.com/api/google-fonts');
      expect(options).toEqual({
        headers: { 'Content-Type': 'application/json' },
        method: 'GET',
      });
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
      const firstResult = await googleFontsApiCache.getCache();

      expect(fetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const secondResult = await googleFontsApiCache.getCache();

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
      const promises = [googleFontsApiCache.getCache(), googleFontsApiCache.getCache(), googleFontsApiCache.getCache()];

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

      await googleFontsApiCache.getCache();
      expect(googleFontsApiCache.getCacheStatus().cached).toBe(true);

      googleFontsApiCache.clearCache();
      expect(googleFontsApiCache.getCacheStatus().cached).toBe(false);
      expect(googleFontsApiCache.getCacheStatus().itemCount).toBe(0);
    });

    it('should handle cache clearing during loading', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

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

      // Start loading
      const loadPromise = googleFontsApiCache.getCache();

      // Clear cache while loading
      googleFontsApiCache.clearCache();

      // Should still complete successfully
      const result = await loadPromise;

      expect(result).toEqual(mockApiResponse);
      // Check that cache clearing was logged (the cache had data to clear)
      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Google Fonts cache loaded: 2 fonts');

      consoleLogSpy.mockRestore();
    });

    it('should provide accurate cache status after operations', async () => {
      // Initial state
      expect(googleFontsApiCache.getCacheStatus()).toEqual(
        expect.objectContaining({
          cached: false,
          itemCount: 0,
        }),
      );

      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockApiResponse,
        ok: true,
        status: 200,
      });

      // After getting complete cache
      await googleFontsApiCache.getCache();
      expect(googleFontsApiCache.getCacheStatus()).toEqual(
        expect.objectContaining({
          cached: true,
          itemCount: 2,
        }),
      );

      // After getting cache
      await googleFontsApiCache.getCache();
      expect(googleFontsApiCache.getCacheStatus()).toEqual(
        expect.objectContaining({
          cached: true,
          itemCount: 2,
        }),
      );
    });

    // After clearing
    googleFontsApiCache.clearCache();
    expect(googleFontsApiCache.getCacheStatus()).toEqual(
      expect.objectContaining({
        cached: false,
        itemCount: 0,
      }),
    );
  });

  describe('Font Finding', () => {
    beforeEach(async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockApiResponse,
        ok: true,
        status: 200,
      });
      await googleFontsApiCache.getCache();
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

    it('should handle empty font family search', async () => {
      const font = await googleFontsApiCache.findFont('');

      expect(font).toBeNull();
    });

    it('should handle whitespace-only font family search', async () => {
      const font = await googleFontsApiCache.findFont('   ');

      expect(font).toBeNull();
    });

    it('should find font with special characters in name', async () => {
      // Mock API response with special character font
      const specialFontResponse = {
        items: [
          {
            category: 'display',
            family: 'Font-With-Hyphens',
            files: { regular: 'font.woff2' },
            kind: 'webfonts#webfont',
            lastModified: '2023-01-01',
            subsets: ['latin'],
            variants: ['regular'],
            version: 'v1',
          },
        ],
        kind: 'webfonts#webfontList',
      };

      googleFontsApiCache.clearCache();
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => specialFontResponse,
        ok: true,
        status: 200,
      });

      const font = await googleFontsApiCache.findFont('Font-With-Hyphens');

      expect(font).toBeDefined();
      expect(font?.family).toBe('Font-With-Hyphens');
    });

  });

  describe('Backend Proxy Integration', () => {
    it('should use backend proxy endpoint with correct configuration', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockApiResponse,
        ok: true,
        status: 200,
      });

      await googleFontsApiCache.getCache();

      // Check the URL object is constructed correctly
      const [[actualUrl, options]] = (fetch as jest.Mock).mock.calls;

      expect(actualUrl.toString()).toBe('https://id.flux3dp.com/api/google-fonts');
      expect(options).toEqual({
        headers: { 'Content-Type': 'application/json' },
        method: 'GET',
      });
    });

    it('should handle FLUXID_HOST configuration', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => mockApiResponse,
        ok: true,
        status: 200,
      });

      await googleFontsApiCache.getCache();

      const fetchCall = (fetch as jest.Mock).mock.calls[0];
      const url = fetchCall[0];

      expect(url.toString()).toBe('https://id.flux3dp.com/api/google-fonts');
    });
  });

  describe('API Error Handling', () => {

    it('should handle empty response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ items: [], kind: 'webfonts#webfontList' }),
        ok: true,
        status: 200,
      });

      const result = await googleFontsApiCache.getCache();

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

      await googleFontsApiCache.getCache();

      expect(consoleLogSpy).toHaveBeenCalledWith('✅ Google Fonts cache loaded: 2 fonts');

      consoleLogSpy.mockRestore();
    });

  });
});

