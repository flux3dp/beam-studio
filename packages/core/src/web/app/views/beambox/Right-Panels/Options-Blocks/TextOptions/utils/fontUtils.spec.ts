import type { GeneralFont } from '@core/interfaces/IFont';

// Mock dependencies - create these before the imports
const mockFontNameMap = new Map();
const mockRequestFontsOfTheFontFamily = jest.fn();
const mockGetWebFontPreviewUrl = jest.fn();

jest.mock('@core/app/actions/beambox/font-funcs', () => ({
  __esModule: true,
  default: {
    fontNameMap: mockFontNameMap,
    requestFontsOfTheFontFamily: mockRequestFontsOfTheFontFamily,
  },
}));

jest.mock('@core/helpers/fonts/fontHelper', () => ({
  __esModule: true,
  default: {
    getWebFontPreviewUrl: mockGetWebFontPreviewUrl,
  },
}));

jest.mock('@core/app/icons/flux/FluxIcons', () => ({
  __esModule: true,
  default: {
    FluxPlus: () => 'FluxPlus',
  },
}));

import {
  createFontFamilyOption,
  createFontStyleOptions,
  createHistoryFontOptions,
  filterFontOptions,
  findAvailableFont,
  getFontFallbacks,
  isLocalFont,
  sanitizeFontFamily,
} from './fontUtils';

describe('fontUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFontNameMap.clear();
  });

  describe('createFontFamilyOption', () => {
    test('should create basic font option without preview', () => {
      mockFontNameMap.set('Arial', 'Arial');
      mockGetWebFontPreviewUrl.mockReturnValue(null);

      const option = createFontFamilyOption('Arial');

      expect(option.value).toBe('Arial');
      expect(option.label).toBeDefined();
    });

    test('should create font option with preview image', () => {
      mockFontNameMap.set('Custom Font', 'Custom Font');
      mockGetWebFontPreviewUrl.mockReturnValue('https://example.com/preview.png');

      const option = createFontFamilyOption('Custom Font');

      expect(option.value).toBe('Custom Font');
      expect(option.label).toBeDefined();
    });

    test('should create history font option', () => {
      mockFontNameMap.set('Arial', 'Arial');
      mockGetWebFontPreviewUrl.mockReturnValue(null);

      const option = createFontFamilyOption('Arial', true);

      expect(option.value).toBe('history-Arial');
      expect(option.family).toBe('Arial');
    });
  });

  describe('isLocalFont', () => {
    test('should return true for local font (with path)', () => {
      const font: GeneralFont = {
        family: 'Arial',
        italic: false,
        path: '/fonts/arial.ttf',
        postscriptName: 'Arial',
        style: 'Regular',
        weight: 400,
      };

      expect(isLocalFont(font)).toBe(true);
    });

    test('should return false for web font (without path)', () => {
      const font: GeneralFont = {
        family: 'Arial',
        italic: false,
        postscriptName: 'Arial',
        style: 'Regular',
        weight: 400,
      };

      expect(isLocalFont(font)).toBe(false);
    });
  });

  describe('getFontFallbacks', () => {
    test('should return expected fallback fonts', () => {
      const fallbacks = getFontFallbacks();

      expect(fallbacks).toEqual(['PingFang TC', 'Arial', 'Times New Roman', 'Ubuntu', 'Noto Sans']);
    });
  });

  describe('findAvailableFont', () => {
    test('should find first available font', () => {
      const candidates = ['CustomFont', 'Arial', 'Times New Roman'];
      const available = ['Times New Roman', 'Helvetica'];

      const result = findAvailableFont(candidates, available);

      expect(result).toBe('Times New Roman');
    });

    test('should return undefined if no font is available', () => {
      const candidates = ['CustomFont', 'UnknownFont'];
      const available = ['Arial', 'Times New Roman'];

      const result = findAvailableFont(candidates, available);

      expect(result).toBeUndefined();
    });
  });

  describe('sanitizeFontFamily', () => {
    test('should return original font if available', () => {
      const font: GeneralFont = {
        family: 'Arial',
        italic: false,
        postscriptName: 'Arial',
        style: 'Regular',
        weight: 400,
      };
      const available = ['Arial', 'Times New Roman'];

      const result = sanitizeFontFamily(font, available);

      expect(result.sanitizedFamily).toBe('Arial');
      expect(result.isChanged).toBe(false);
    });

    test('should fallback to available font', () => {
      const font: GeneralFont = {
        family: 'CustomFont',
        italic: false,
        postscriptName: 'CustomFont',
        style: 'Regular',
        weight: 400,
      };
      const available = ['Arial', 'Times New Roman'];

      const result = sanitizeFontFamily(font, available);

      expect(result.sanitizedFamily).toBe('Arial'); // First fallback
      expect(result.isChanged).toBe(true);
    });

    test('should throw error if no fonts available', () => {
      const font: GeneralFont = {
        family: 'CustomFont',
        italic: false,
        postscriptName: 'CustomFont',
        style: 'Regular',
        weight: 400,
      };
      const available: string[] = [];

      expect(() => sanitizeFontFamily(font, available)).toThrow('No available font families found');
    });
  });

  describe('createFontStyleOptions', () => {
    test('should create style options for valid family', () => {
      mockRequestFontsOfTheFontFamily.mockReturnValue([{ style: 'Regular' }, { style: 'Bold' }, { style: 'Italic' }]);

      const options = createFontStyleOptions('Arial');

      expect(options).toEqual([
        { label: 'Regular', value: 'Regular' },
        { label: 'Bold', value: 'Bold' },
        { label: 'Italic', value: 'Italic' },
      ]);
    });

    test('should return empty array for invalid family', () => {
      const options = createFontStyleOptions('');

      expect(options).toEqual([]);
    });
  });

  describe('filterFontOptions', () => {
    beforeEach(() => {
      mockFontNameMap.set('Arial', 'Arial Font');
      mockFontNameMap.set('Times New Roman', 'Times Font');
    });

    test('should match font family name', () => {
      expect(filterFontOptions('ari', 'Arial')).toBe(true);
      expect(filterFontOptions('times', 'Times New Roman')).toBe(true);
      expect(filterFontOptions('xyz', 'Arial')).toBe(false);
    });

    test('should match font display name', () => {
      expect(filterFontOptions('font', 'Arial')).toBe(true); // Matches "Arial Font"
      expect(filterFontOptions('times', 'Times New Roman')).toBe(true); // Matches "Times Font"
    });

    test('should be case insensitive', () => {
      expect(filterFontOptions('ARIAL', 'Arial')).toBe(true);
      expect(filterFontOptions('arial', 'Arial')).toBe(true);
    });
  });

  describe('createHistoryFontOptions', () => {
    test('should create options for available history fonts', () => {
      const history = ['Arial', 'Times New Roman', 'CustomFont'];
      const available = ['Arial', 'Times New Roman'];

      mockFontNameMap.set('Arial', 'Arial');
      mockFontNameMap.set('Times New Roman', 'Times New Roman');
      mockGetWebFontPreviewUrl.mockReturnValue(null);

      const options = createHistoryFontOptions(history, available);

      expect(options).toHaveLength(2);
      expect(options[0].family).toBe('Arial');
      expect(options[1].family).toBe('Times New Roman');
    });

    test('should filter out unavailable fonts', () => {
      const history = ['CustomFont', 'UnknownFont'];
      const available = ['Arial', 'Times New Roman'];

      const options = createHistoryFontOptions(history, available);

      expect(options).toEqual([]);
    });
  });
});
