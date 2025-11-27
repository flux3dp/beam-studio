import { getCategoriesForStyle, getCategoryForOption, getStyleConfig, getStylesForCategory } from './categories';
import type { CategoryLike, StyleLike } from './categories';

const STYLES: StyleLike[] = [
  { id: 'plain', tags: ['customize'] },
  { id: 'logo-cute', tags: ['logo', 'cartoon'] },
  { id: 'logo-neon', tags: ['logo', 'contemporary'] },
  { id: 'edit-line', tags: ['line-art'] },
];

const CATEGORIES: CategoryLike[] = [
  { id: 'customize', tags: ['customize'] },
  { id: 'logo', tags: ['logo'] },
  { id: 'cartoon', tags: ['cartoon'] },
  { id: 'line-art', tags: ['line-art'] },
];

describe('Category Logic', () => {
  describe('getStylesForCategory', () => {
    it('filters styles by category tags (OR logic)', () => {
      // Logo category should match 'logo-cute' and 'logo-neon'
      const logos = getStylesForCategory('logo', STYLES, CATEGORIES);

      expect(logos).toHaveLength(2);
      expect(logos.map((s) => s.id)).toEqual(expect.arrayContaining(['logo-cute', 'logo-neon']));
    });

    it('returns empty array for invalid or empty category', () => {
      expect(getStylesForCategory('missing', STYLES, CATEGORIES)).toEqual([]);
      expect(getStylesForCategory('logo', [], [])).toEqual([]);
    });
  });

  describe('getCategoriesForStyle', () => {
    it('finds all categories a style belongs to', () => {
      // 'logo-cute' has tags ['logo', 'cartoon'], should belong to both categories
      const cats = getCategoriesForStyle('logo-cute', STYLES, CATEGORIES);

      expect(cats).toHaveLength(2);
      expect(cats.map((c) => c.id)).toEqual(expect.arrayContaining(['logo', 'cartoon']));
    });

    it('returns empty array for missing style', () => {
      expect(getCategoriesForStyle('missing', STYLES, CATEGORIES)).toEqual([]);
    });
  });

  describe('getStyleConfig', () => {
    it('returns the requested style configuration', () => {
      const config = getStyleConfig('logo-cute', STYLES);

      expect(config.id).toBe('logo-cute');
    });

    it('returns fallback when style is missing', () => {
      // Fallback 1: First available style
      expect(getStyleConfig('missing', STYLES).id).toBe('plain');

      // Fallback 2: Hardcoded safe default if list is empty
      expect(getStyleConfig('missing', []).id).toBe('plain');
    });
  });

  describe('getCategoryForOption', () => {
    it('returns the first matching category', () => {
      const cat = getCategoryForOption('logo-cute', STYLES, CATEGORIES);

      // Could be 'logo' or 'cartoon' depending on array order, but must be defined
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
