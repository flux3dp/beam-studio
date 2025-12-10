import type { Category, Style } from '@core/helpers/api/ai-image-config';

import { getCategoryForOption, getStyleConfig, getStylesForCategory } from './categories';

const STYLES: Style[] = [
  { displayName: 'Customize', id: 'customize', inputFields: [], modes: [], previewImage: '', tags: ['customize'] },
  {
    displayName: 'Logo Cute',
    id: 'logo-cute',
    inputFields: [],
    modes: [],
    previewImage: '',
    tags: ['logo', 'cartoon'],
  },
  {
    displayName: 'Logo Neon',
    id: 'logo-neon',
    inputFields: [],
    modes: [],
    previewImage: '',
    tags: ['logo', 'contemporary'],
  },
  { displayName: 'Edit Line', id: 'edit-line', inputFields: [], modes: [], previewImage: '', tags: ['line-art'] },
];

const CATEGORIES: Category[] = [
  { displayName: 'Customize', id: 'customize', previewImage: '', tags: ['customize'] },
  { displayName: 'Logo', id: 'logo', previewImage: '', tags: ['logo'] },
  { displayName: 'Cartoon', id: 'cartoon', previewImage: '', tags: ['cartoon'] },
  { displayName: 'Line Art', id: 'line-art', previewImage: '', tags: ['line-art'] },
];

describe('Category Logic', () => {
  describe('getStylesForCategory', () => {
    it('filters styles by category tags (OR logic)', () => {
      const logos = getStylesForCategory('logo', STYLES, CATEGORIES);

      expect(logos).toHaveLength(2);
      expect(logos.map((s) => s.id)).toEqual(expect.arrayContaining(['logo-cute', 'logo-neon']));
    });

    it('returns empty array for invalid or empty category', () => {
      expect(getStylesForCategory('missing', STYLES, CATEGORIES)).toEqual([]);
      expect(getStylesForCategory('logo', [], [])).toEqual([]);
    });
  });

  describe('getStyleConfig', () => {
    it('returns the requested style configuration', () => {
      const config = getStyleConfig('logo-cute', STYLES);

      expect(config.id).toBe('logo-cute');
    });

    it('returns fallback when style is missing', () => {
      expect(getStyleConfig('missing', STYLES).id).toBe('customize');
      expect(getStyleConfig('missing', []).id).toBe('customize');
    });
  });

  describe('getCategoryForOption', () => {
    it('returns the first matching category', () => {
      const cat = getCategoryForOption('logo-cute', STYLES, CATEGORIES);

      expect(cat).toBeDefined();
      expect(['logo', 'cartoon']).toContain(cat?.id);
    });

    it('returns null for invalid inputs', () => {
      expect(getCategoryForOption(null)).toBeNull();
      expect(getCategoryForOption('missing-style', STYLES, CATEGORIES)).toBeNull();
      expect(getCategoryForOption('logo-cute', [], [])).toBeNull();
    });
  });
});
