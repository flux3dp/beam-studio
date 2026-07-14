/**
 * Unit tests for the Google Font store (app/stores/googleFontStore/index.ts).
 *
 * Pattern 9 (direct Zustand store test). The store owns font-load orchestration:
 * CSS <link> injection, variant discovery, registration (postscript dedup),
 * binary caching, offline queueing, network gating and font-history persistence.
 *
 * Dependencies are mocked: the Google Fonts API cache (googleFontsApiCache),
 * local-font detection (utils/detection), and network via navigator.onLine.
 * The binary <ArrayBuffer> download uses the globally-enabled jest-fetch-mock.
 *
 * Boundaries (not covered here): the API cache's own fetch/retry logic
 * (googleFontsApiCache.spec.ts), the service-level context scan
 * (helpers/fonts/googleFontService.spec.ts), and real glyph rendering / the
 * fonts panel UI (Cypress).
 */
import fetchMock from 'jest-fetch-mock';

const mockFindFont = jest.fn();
// Default resolves so the module-load pre-population IIFE (getCache().then) is safe.
const mockGetCache = jest.fn().mockResolvedValue({ items: [], kind: 'webfonts#webfontList' });
const mockIsLocalOrWebFont = jest.fn();
const mockIsIconFont = jest.fn();

jest.mock('@core/helpers/fonts/googleFontsApiCache', () => ({
  googleFontsApiCache: {
    findFont: (...args: any[]) => mockFindFont(...args),
    getCache: (...args: any[]) => mockGetCache(...args),
  },
}));

jest.mock('./utils/detection', () => ({
  isIconFont: (...args: any[]) => mockIsIconFont(...args),
  isLocalOrWebFont: (...args: any[]) => mockIsLocalOrWebFont(...args),
}));

// storageStore has a central __mocks__ file; rely on it.
import { useStorageStore } from '@core/app/stores/storageStore';

import { useGoogleFontStore } from './index';

const ROBOTO_ITEM = {
  category: 'sans-serif',
  family: 'Roboto',
  files: {
    '700': 'https://fonts.gstatic.com/s/roboto/700.ttf',
    italic: 'https://fonts.gstatic.com/s/roboto/italic.ttf',
    regular: 'https://fonts.gstatic.com/s/roboto/regular.ttf',
  },
  kind: 'webfonts#webfont',
  lastModified: '2025-01-01',
  subsets: ['latin'],
  variants: ['regular', '700', 'italic'],
  version: 'v1',
};

/**
 * jsdom does not fire <link> onload. Patch appendChild so any injected
 * stylesheet link resolves immediately, letting the store's await settle.
 */
let appendSpy: jest.SpyInstance;

const setOnline = (online: boolean) => {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: online });
};

describe('googleFontStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setOnline(true);
    // Fresh network state reflecting online-ness for the store's cached networkState.
    useGoogleFontStore.getState().updateNetworkState();
    mockIsLocalOrWebFont.mockReturnValue(false);
    mockIsIconFont.mockReturnValue(false);
    mockGetCache.mockResolvedValue({ items: [], kind: 'webfonts#webfontList' });
    useStorageStore.getState().set('font-history', []);

    const realAppend = HTMLHeadElement.prototype.appendChild;

    appendSpy = jest.spyOn(document.head, 'appendChild').mockImplementation((node: any) => {
      const result = realAppend.call(document.head, node);

      if (node?.tagName === 'LINK' && typeof node.onload === 'function') {
        // Fire asynchronously so the store's Promise wiring is in place first.
        setTimeout(() => node.onload(), 0);
      }

      return result;
    });
  });

  afterEach(() => {
    appendSpy.mockRestore();
    document.head.querySelectorAll('link').forEach((l) => l.remove());
  });

  describe('initial state', () => {
    it('starts with empty collections and a network state', () => {
      const state = useGoogleFontStore.getState();

      expect(state.sessionLoadedFonts.size).toBe(0);
      expect(state.registeredFonts.size).toBe(0);
      expect(state.cssLinks.size).toBe(0);
      expect(state.activeFontLoads.size).toBe(0);
      expect(state.queuedFontLoads).toEqual([]);
      expect(state.networkState).toEqual(
        expect.objectContaining({ isOnline: expect.any(Boolean), lastChecked: expect.any(Number) }),
      );
    });
  });

  describe('loadGoogleFont', () => {
    it('injects a stylesheet link with the URL derived from the best variant and marks the font loaded', async () => {
      mockFindFont.mockResolvedValue(ROBOTO_ITEM);

      await useGoogleFontStore.getState().loadGoogleFont('Roboto');

      // Roboto has a 'regular' variant → best variant weight 400 → non-italic URL.
      const link = document.head.querySelector('link[rel="stylesheet"]') as HTMLLinkElement;

      expect(link).not.toBeNull();
      expect(link.href).toBe('https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap');

      const state = useGoogleFontStore.getState();

      expect(state.sessionLoadedFonts.has('Roboto')).toBe(true);
      expect(state.cssLinks.get('Roboto')?.purpose).toBe('text-editing');
      expect(state.activeFontLoads.has('Roboto')).toBe(false);
    });

    it('builds an italic-only URL when the family exposes only italic variants', async () => {
      mockFindFont.mockResolvedValue({
        ...ROBOTO_ITEM,
        family: 'OnlyItalic',
        files: { '400italic': 'x', italic: 'y' },
        variants: ['italic', '300italic'],
      });

      await useGoogleFontStore.getState().loadGoogleFont('OnlyItalic');

      const link = document.head.querySelector('link[rel="stylesheet"]') as HTMLLinkElement;

      // italicOnly=true → ital,wght@1,<weight>. Best italic variant resolves to weight 400.
      expect(link.href).toBe('https://fonts.googleapis.com/css2?family=OnlyItalic:ital,wght@1,400&display=swap');
    });

    it('is a no-op (no fetch, no link) when the font is already in sessionLoadedFonts', async () => {
      useGoogleFontStore.setState({ sessionLoadedFonts: new Set(['Roboto']) });

      await useGoogleFontStore.getState().loadGoogleFont('Roboto');

      expect(mockFindFont).not.toHaveBeenCalled();
      expect(document.head.querySelector('link')).toBeNull();
    });

    it('skips local / web-safe fonts without touching the API cache', async () => {
      mockIsLocalOrWebFont.mockReturnValue(true);

      await useGoogleFontStore.getState().loadGoogleFont('Arial');

      expect(mockFindFont).not.toHaveBeenCalled();
      expect(useGoogleFontStore.getState().sessionLoadedFonts.has('Arial')).toBe(false);
    });

    it('skips icon fonts', async () => {
      mockIsIconFont.mockReturnValue(true);

      await useGoogleFontStore.getState().loadGoogleFont('Material Icons');

      expect(mockFindFont).not.toHaveBeenCalled();
    });

    it('queues the font instead of loading it when offline', async () => {
      setOnline(false);
      useGoogleFontStore.getState().updateNetworkState();

      await useGoogleFontStore.getState().loadGoogleFont('Roboto');

      const state = useGoogleFontStore.getState();

      expect(mockFindFont).not.toHaveBeenCalled();
      expect(state.queuedFontLoads).toEqual([{ fontFamily: 'Roboto', priority: 'normal', purpose: 'text-editing' }]);
      expect(state.sessionLoadedFonts.has('Roboto')).toBe(false);
    });

    it('records a failed load (and does not mark loaded) when the font is missing from the cache', async () => {
      mockFindFont.mockResolvedValue(null);
      jest.spyOn(console, 'error').mockImplementation(() => {});

      await useGoogleFontStore.getState().loadGoogleFont('Ghost');

      const state = useGoogleFontStore.getState();

      expect(state.sessionLoadedFonts.has('Ghost')).toBe(false);
      expect(state.failedLoads.has('Ghost')).toBe(true);
      expect(state.failedLoads.get('Ghost')?.error).toContain('not found');
      expect(state.activeFontLoads.has('Ghost')).toBe(false);
    });
  });

  describe('registerGoogleFont', () => {
    it('registers one GoogleFont per variant keyed by postscript name', async () => {
      mockFindFont.mockResolvedValue(ROBOTO_ITEM);

      await useGoogleFontStore.getState().registerGoogleFont('Roboto');

      const { registeredFonts } = useGoogleFontStore.getState();

      // regular → Roboto-Regular, 700 → Roboto-Bold,
      // italic → weight 400 + italic → Roboto-RegularItalic
      expect(registeredFonts.size).toBe(3);
      expect(registeredFonts.has('Roboto-Regular')).toBe(true);
      expect(registeredFonts.has('Roboto-Bold')).toBe(true);
      expect(registeredFonts.has('Roboto-RegularItalic')).toBe(true);

      const regular = registeredFonts.get('Roboto-Regular')!;

      expect(regular.source).toBe('google');
      expect(regular.family).toBe('Roboto');
      expect(regular.weight).toBe(400);
      expect(typeof regular.binaryLoader).toBe('function');
    });

    it('deduplicates: registering the same family twice does not add duplicate entries', async () => {
      mockFindFont.mockResolvedValue(ROBOTO_ITEM);

      await useGoogleFontStore.getState().registerGoogleFont('Roboto');

      const sizeAfterFirst = useGoogleFontStore.getState().registeredFonts.size;

      await useGoogleFontStore.getState().registerGoogleFont('Roboto');

      expect(useGoogleFontStore.getState().registeredFonts.size).toBe(sizeAfterFirst);
    });

    it('does nothing when the font is not in the cache', async () => {
      mockFindFont.mockResolvedValue(null);
      jest.spyOn(console, 'warn').mockImplementation(() => {});

      await useGoogleFontStore.getState().registerGoogleFont('Ghost');

      expect(useGoogleFontStore.getState().registeredFonts.size).toBe(0);
    });

    it('swallows API errors without throwing or registering', async () => {
      mockFindFont.mockRejectedValue(new Error('network down'));
      jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(useGoogleFontStore.getState().registerGoogleFont('Roboto')).resolves.toBeUndefined();
      expect(useGoogleFontStore.getState().registeredFonts.size).toBe(0);
    });
  });

  describe('registration lookups', () => {
    it('isRegistered / getRegisteredFont reflect registered fonts', async () => {
      mockFindFont.mockResolvedValue(ROBOTO_ITEM);
      await useGoogleFontStore.getState().registerGoogleFont('Roboto');

      const state = useGoogleFontStore.getState();

      expect(state.isRegistered('Roboto-Bold')).toBe(true);
      expect(state.isRegistered('Nonexistent-Regular')).toBe(false);
      expect(state.getRegisteredFont('Roboto-Bold')?.weight).toBe(700);
      expect(state.getRegisteredFont('Nonexistent-Regular')).toBeUndefined();
    });
  });

  describe('loadGoogleFontBinary', () => {
    it('fetches the TTF for the resolved variant, returns the buffer, and caches it', async () => {
      mockFindFont.mockResolvedValue(ROBOTO_ITEM);

      const buffer = new ArrayBuffer(8);

      fetchMock.mockResponseOnce('', { status: 200 });
      // The store reads response.arrayBuffer(); script it to yield our buffer.
      jest.spyOn(Response.prototype, 'arrayBuffer').mockResolvedValue(buffer);

      const result = await useGoogleFontStore.getState().loadGoogleFontBinary('Roboto', 400, 'normal');

      expect(result).toBe(buffer);

      const cached = useGoogleFontStore.getState().getBinaryFromCache('Roboto', 400, 'normal');

      expect(cached?.buffer).toBe(buffer);
      expect(cached?.family).toBe('Roboto');
      expect(cached?.weight).toBe(400);
    });

    it('returns null when offline (no fetch attempted)', async () => {
      setOnline(false);
      useGoogleFontStore.getState().updateNetworkState();
      mockFindFont.mockResolvedValue(ROBOTO_ITEM);
      fetchMock.resetMocks();

      const result = await useGoogleFontStore.getState().loadGoogleFontBinary('Roboto', 400, 'normal');

      expect(result).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('serves a fresh cached binary without re-fetching', async () => {
      const buffer = new ArrayBuffer(4);
      const cacheKey = 'Roboto-400-normal';

      useGoogleFontStore.setState({
        cachedBinaries: new Map([
          [cacheKey, { buffer, family: 'Roboto', style: 'normal', timestamp: Date.now(), weight: 400 }],
        ]),
      });
      fetchMock.resetMocks();

      const result = await useGoogleFontStore.getState().loadGoogleFontBinary('Roboto', 400, 'normal');

      expect(result).toBe(buffer);
      expect(mockFindFont).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('network gating', () => {
    it('isNetworkAvailableForGoogleFonts is false when offline', () => {
      setOnline(false);
      useGoogleFontStore.getState().updateNetworkState();

      expect(useGoogleFontStore.getState().isNetworkAvailableForGoogleFonts()).toBe(false);
    });

    it('isNetworkAvailableForGoogleFonts is true when online', () => {
      setOnline(true);
      useGoogleFontStore.getState().updateNetworkState();

      expect(useGoogleFontStore.getState().isNetworkAvailableForGoogleFonts()).toBe(true);
    });

    it('updateNetworkState drains the queue once back online', async () => {
      setOnline(false);
      useGoogleFontStore.getState().updateNetworkState();
      await useGoogleFontStore.getState().loadGoogleFont('Roboto'); // queued while offline

      expect(useGoogleFontStore.getState().queuedFontLoads).toHaveLength(1);

      mockFindFont.mockResolvedValue(ROBOTO_ITEM);
      setOnline(true);
      useGoogleFontStore.getState().updateNetworkState(); // triggers processQueue

      // processQueue kicks off loadGoogleFont for the queued family.
      await new Promise((r) => setTimeout(r, 0));
      expect(mockFindFont).toHaveBeenCalledWith('Roboto');
    });
  });

  describe('addToHistory', () => {
    it('prepends the family and persists to storage font-history', () => {
      useStorageStore.getState().set('font-history', ['Old']);

      useGoogleFontStore.getState().addToHistory({ family: 'Roboto' } as any);

      expect(useStorageStore.getState()['font-history']).toEqual(['Roboto', 'Old']);
    });

    it('moves an existing family to the front without duplicating it', () => {
      useStorageStore.getState().set('font-history', ['A', 'Roboto', 'B']);

      useGoogleFontStore.getState().addToHistory({ family: 'Roboto' } as any);

      expect(useStorageStore.getState()['font-history']).toEqual(['Roboto', 'A', 'B']);
    });

    it('caps the history at the maximum size (5)', () => {
      useStorageStore.getState().set('font-history', ['A', 'B', 'C', 'D', 'E']);

      useGoogleFontStore.getState().addToHistory({ family: 'F' } as any);

      const history = useStorageStore.getState()['font-history'];

      expect(history).toHaveLength(5);
      expect(history[0]).toBe('F');
      expect(history).not.toContain('E');
    });

    it('ignores a font with no family', () => {
      useStorageStore.getState().set('font-history', ['A']);

      useGoogleFontStore.getState().addToHistory({ family: '' } as any);

      expect(useStorageStore.getState()['font-history']).toEqual(['A']);
    });
  });

  describe('fallback helpers', () => {
    it('getFallbackFont maps a serif-ish Google family to a serif web-safe stack', () => {
      expect(useGoogleFontStore.getState().getFallbackFont('Playfair Display')).toBe('Times New Roman, serif');
    });

    it('getFallbackPostScriptName maps a known fallback family, defaulting to ArialMT', () => {
      const state = useGoogleFontStore.getState();

      expect(state.getFallbackPostScriptName('Times New Roman')).toBe('TimesNewRomanPSMT');
      expect(state.getFallbackPostScriptName('Totally Unknown')).toBe('ArialMT');
    });
  });

  describe('isGoogleFontLoaded', () => {
    it('reflects session-loaded state', () => {
      expect(useGoogleFontStore.getState().isGoogleFontLoaded('Roboto')).toBe(false);
      useGoogleFontStore.setState({ sessionLoadedFonts: new Set(['Roboto']) });
      expect(useGoogleFontStore.getState().isGoogleFontLoaded('Roboto')).toBe(true);
    });
  });
});
