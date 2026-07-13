/**
 * Unit tests for the Google Fonts service layer (googleFontService.ts).
 *
 * Scope: the SERVICE orchestration flow — scanning the SVG document context for
 * Google Font usage, deriving variants, and driving the store to load/register
 * fonts (or apply web-safe fallbacks when offline). The underlying API cache is
 * covered by googleFontsApiCache.spec.ts and the store internals by
 * app/stores/googleFontStore/index.spec.ts; those are not duplicated here.
 *
 * Boundaries (E2E-only, not covered here): actual glyph rendering, real network
 * CSS <link> loading, and the Google Fonts panel UI (Cypress
 * google-fonts-panel / google-fonts-live specs).
 */
const mockGetAvailableFonts = jest.fn();
const mockApplyStyle = jest.fn();
const mockIsLocalOrWebFont = jest.fn();

// Store action mocks
const mockIsNetworkAvailable = jest.fn();
const mockIsGoogleFontLoaded = jest.fn();
const mockLoadGoogleFont = jest.fn();
const mockRegisterGoogleFont = jest.fn();
const mockGetFallbackFont = jest.fn();
const mockGetFallbackPostScriptName = jest.fn();
const mockLoadGoogleFontState = jest.fn();

const storeState = {
  getFallbackFont: (...args: any[]) => mockGetFallbackFont(...args),
  getFallbackPostScriptName: (...args: any[]) => mockGetFallbackPostScriptName(...args),
  isGoogleFontLoaded: (...args: any[]) => mockIsGoogleFontLoaded(...args),
  isNetworkAvailableForGoogleFonts: (...args: any[]) => mockIsNetworkAvailable(...args),
  loadGoogleFont: (...args: any[]) => mockLoadGoogleFont(...args),
  registerGoogleFont: (...args: any[]) => mockRegisterGoogleFont(...args),
  sessionLoadedFonts: new Set<string>(),
};

jest.mock('@core/app/stores/googleFontStore', () => ({
  useGoogleFontStore: {
    getState: () => storeState,
    setState: (...args: any[]) => mockLoadGoogleFontState(...args),
  },
}));

jest.mock('@core/app/stores/googleFontStore/utils/detection', () => ({
  isLocalOrWebFont: (...args: any[]) => mockIsLocalOrWebFont(...args),
}));

jest.mock('./webFonts.google', () => ({
  applyStyle: (...args: any[]) => mockApplyStyle(...args),
  getAvailableFonts: (...args: any[]) => mockGetAvailableFonts(...args),
}));

// storageStore has a central __mocks__ file; rely on it (do NOT re-mock).
import { useStorageStore } from '@core/app/stores/storageStore';

import { loadAllInitialGoogleFonts, loadContextGoogleFonts } from './googleFontService';

const makeTextElement = (attrs: Record<string, string>): SVGTextElement => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'text');

  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));

  return el;
};

/** Build the DOM layout that loadContextGoogleFonts scans. */
const mountSvgContext = (texts: SVGTextElement[]) => {
  document.body.innerHTML = '<div id="svgcontent"><g class="layer" id="layer1"></g></div><div id="svg_defs"></div>';

  const layer = document.querySelector('#svgcontent g.layer')!;

  texts.forEach((t) => layer.appendChild(t));
};

describe('googleFontService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    storeState.sessionLoadedFonts = new Set();
    // Default: online, nothing loaded, everything is a Google font (not local/web).
    mockIsNetworkAvailable.mockReturnValue(true);
    mockIsGoogleFontLoaded.mockReturnValue(false);
    mockIsLocalOrWebFont.mockReturnValue(false);
    useStorageStore.getState().set('font-history', []);
    useStorageStore.getState().set('active-lang', 'en');
  });

  describe('loadContextGoogleFonts', () => {
    it('does nothing when there are no text elements and network is available', () => {
      mountSvgContext([]);
      loadContextGoogleFonts();

      expect(mockLoadGoogleFont).not.toHaveBeenCalled();
      expect(mockRegisterGoogleFont).not.toHaveBeenCalled();
    });

    it('loads and registers each distinct Google font family found in context', () => {
      mountSvgContext([
        makeTextElement({ 'font-family': 'Roboto', 'font-weight': '700' }),
        makeTextElement({ 'font-family': 'Open Sans', 'font-style': 'italic' }),
      ]);

      loadContextGoogleFonts();

      expect(mockLoadGoogleFont).toHaveBeenCalledWith('Roboto');
      expect(mockLoadGoogleFont).toHaveBeenCalledWith('Open Sans');
      expect(mockRegisterGoogleFont).toHaveBeenCalledWith('Roboto');
      expect(mockRegisterGoogleFont).toHaveBeenCalledWith('Open Sans');
    });

    it('strips surrounding quotes and whitespace from font-family before use', () => {
      // Surrounding quotes are stripped, then whitespace trimmed.
      mountSvgContext([makeTextElement({ 'font-family': '"Roboto"' })]);

      loadContextGoogleFonts();

      expect(mockLoadGoogleFont).toHaveBeenCalledWith('Roboto');
      expect(mockRegisterGoogleFont).toHaveBeenCalledWith('Roboto');
    });

    it('deduplicates by postscript name so a family used many times loads once', () => {
      // Two elements with the same family + same derived variant → one entry.
      mountSvgContext([
        makeTextElement({ 'font-family': 'Roboto', 'font-weight': '400' }),
        makeTextElement({ 'font-family': 'Roboto', 'font-weight': 'normal' }),
      ]);

      loadContextGoogleFonts();

      expect(mockLoadGoogleFont).toHaveBeenCalledTimes(1);
      expect(mockLoadGoogleFont).toHaveBeenCalledWith('Roboto');
      expect(mockRegisterGoogleFont).toHaveBeenCalledTimes(1);
    });

    it('skips loadGoogleFont when the family is already loaded but still registers it', () => {
      mockIsGoogleFontLoaded.mockReturnValue(true);
      mountSvgContext([makeTextElement({ 'font-family': 'Roboto' })]);

      loadContextGoogleFonts();

      expect(mockLoadGoogleFont).not.toHaveBeenCalled();
      expect(mockRegisterGoogleFont).toHaveBeenCalledWith('Roboto');
    });

    it('ignores local / web-safe fonts (does not load or register them)', () => {
      mockIsLocalOrWebFont.mockImplementation((f: string) => f === 'Arial');
      mountSvgContext([makeTextElement({ 'font-family': 'Arial' }), makeTextElement({ 'font-family': 'Roboto' })]);

      loadContextGoogleFonts();

      expect(mockLoadGoogleFont).toHaveBeenCalledTimes(1);
      expect(mockLoadGoogleFont).toHaveBeenCalledWith('Roboto');
      expect(mockRegisterGoogleFont).not.toHaveBeenCalledWith('Arial');
    });

    it('also scans text inside #svg_defs', () => {
      document.body.innerHTML = '<div id="svgcontent"><g class="layer"></g></div><div id="svg_defs"></div>';
      document.querySelector('#svg_defs')!.appendChild(makeTextElement({ 'font-family': 'Roboto' }));

      loadContextGoogleFonts();

      expect(mockLoadGoogleFont).toHaveBeenCalledWith('Roboto');
    });

    describe('offline behavior', () => {
      beforeEach(() => {
        mockIsNetworkAvailable.mockReturnValue(false);
        mockGetFallbackFont.mockReturnValue('Times New Roman, serif');
        mockGetFallbackPostScriptName.mockReturnValue('TimesNewRomanPSMT');
      });

      it('replaces Google font-family with a web-safe fallback on offline import', () => {
        const textElem = makeTextElement({ 'font-family': 'Roboto', 'font-postscript-name': 'Roboto-Regular' });

        mountSvgContext([textElem]);

        loadContextGoogleFonts();

        expect(mockLoadGoogleFont).not.toHaveBeenCalled();
        expect(mockRegisterGoogleFont).not.toHaveBeenCalled();
        expect(textElem.getAttribute('font-family')).toBe('Times New Roman, serif');
        // The postscript attribute is rewritten to the fallback's postscript name.
        expect(textElem.getAttribute('font-postscript-name')).toBe('TimesNewRomanPSMT');
      });

      it('leaves local / web-safe fonts untouched during offline fallback', () => {
        mockIsLocalOrWebFont.mockImplementation((f: string) => f === 'Arial');

        const arialElem = makeTextElement({ 'font-family': 'Arial' });

        mountSvgContext([arialElem]);

        loadContextGoogleFonts();

        expect(arialElem.getAttribute('font-family')).toBe('Arial');
        expect(mockGetFallbackFont).not.toHaveBeenCalled();
      });
    });

    it('does not throw if the DOM scan blows up (error path is swallowed)', () => {
      const spy = jest.spyOn(document, 'querySelectorAll').mockImplementation(() => {
        throw new Error('boom');
      });

      expect(() => loadContextGoogleFonts()).not.toThrow();
      spy.mockRestore();
    });
  });

  describe('loadAllInitialGoogleFonts', () => {
    it('applies static font CSS, then processes history and context', () => {
      mockGetAvailableFonts.mockReturnValue([{ family: 'Noto Sans TC' }]);
      // Provide a Google font in history so loadHistoryGoogleFonts triggers a load.
      useStorageStore.getState().set('font-history', ['Lobster']);
      mockIsLocalOrWebFont.mockImplementation((f: string) => f === 'Noto Sans TC');
      mountSvgContext([makeTextElement({ 'font-family': 'Inter' })]);

      loadAllInitialGoogleFonts('zh-tw', []);

      // Static: getAvailableFonts(lang) + applyStyle
      expect(mockGetAvailableFonts).toHaveBeenCalledWith('zh-tw');
      expect(mockApplyStyle).toHaveBeenCalledWith([{ family: 'Noto Sans TC' }]);
      // History: 'Lobster' is a Google font → loaded
      expect(mockLoadGoogleFont).toHaveBeenCalledWith('Lobster');
      // Context: 'Inter' from the DOM → loaded + registered
      expect(mockLoadGoogleFont).toHaveBeenCalledWith('Inter');
      expect(mockRegisterGoogleFont).toHaveBeenCalledWith('Inter');
    });

    it('cleans Google fonts out of history when offline instead of loading them', () => {
      mockGetAvailableFonts.mockReturnValue([]);
      mockIsNetworkAvailable.mockReturnValue(false);
      // 'Arial' is local/web-safe (kept); 'Lobster' is a Google font (removed).
      mockIsLocalOrWebFont.mockImplementation((f: string) => f === 'Arial');
      useStorageStore.getState().set('font-history', ['Arial', 'Lobster']);

      loadAllInitialGoogleFonts('en', []);

      expect(mockLoadGoogleFont).not.toHaveBeenCalledWith('Lobster');
      // History is rewritten to keep only the local/web-safe entry.
      expect(useStorageStore.getState()['font-history']).toEqual(['Arial']);
    });

    it('skips history processing entirely when history is empty', () => {
      mockGetAvailableFonts.mockReturnValue([]);
      useStorageStore.getState().set('font-history', []);
      mountSvgContext([]);

      loadAllInitialGoogleFonts('en', []);

      expect(mockLoadGoogleFont).not.toHaveBeenCalled();
    });
  });
});
