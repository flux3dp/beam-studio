import { ALL_STYLES, CATEGORIES, getCategoriesForStyle, getStylesForCategory } from './categories';
import { STYLE_PRESET_KEYS } from './stylePresets';

describe('tag-based category system', () => {
  describe('data integrity', () => {
    it('should ensure all styles have at least one tag', () => {
      ALL_STYLES.forEach((style) => {
        expect(style.tags).toBeDefined();
        expect(style.tags.length).toBeGreaterThan(0);
      });
    });

    it('should ensure all styles have required properties', () => {
      ALL_STYLES.forEach((style) => {
        expect(style.id).toBeTruthy();
        expect(style.displayName).toBeTruthy();
        expect(style.mode).toBeDefined();
        expect(Array.isArray(style.mode)).toBe(true);
        expect(style.previewImage).toBeTruthy();
        expect(Array.isArray(style.tags)).toBe(true);
      });
    });

    it('should ensure all categories have at least one tag', () => {
      CATEGORIES.forEach((category) => {
        expect(category.tags).toBeDefined();
        expect(category.tags.length).toBeGreaterThan(0);
      });
    });

    it('should ensure all defined presets are in ALL_STYLES', () => {
      const styleIds = ALL_STYLES.map((s) => s.id);

      STYLE_PRESET_KEYS.forEach((presetKey) => {
        expect(styleIds).toContain(presetKey);
      });
    });

    it('should ensure no duplicate style IDs', () => {
      const styleIds = ALL_STYLES.map((s) => s.id);
      const uniqueIds = new Set(styleIds);

      expect(styleIds.length).toBe(uniqueIds.size);
    });

    it('should ensure no duplicate category IDs', () => {
      const categoryIds = CATEGORIES.map((c) => c.id);
      const uniqueIds = new Set(categoryIds);

      expect(categoryIds.length).toBe(uniqueIds.size);
    });
  });

  describe('tag-based filtering', () => {
    it('should allow styles to appear in multiple categories', () => {
      // "Cute Logo" should appear in both Logo and Cartoon categories
      const cuteLogoCategories = getCategoriesForStyle('logo-cute');
      const categoryIds = cuteLogoCategories.map((c) => c.id);

      expect(categoryIds).toContain('logo');
      expect(categoryIds).toContain('cartoon');
      expect(cuteLogoCategories.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter styles correctly by category tags (OR logic)', () => {
      const logoStyles = getStylesForCategory('logo');

      // All styles in Logo category should have the 'logo' tag
      logoStyles.forEach((style) => {
        expect(style.tags).toContain('logo');
      });

      // Should contain all logo styles
      expect(logoStyles.some((s) => s.id === 'logo-cute')).toBe(true);
      expect(logoStyles.some((s) => s.id === 'logo-crafty')).toBe(true);
      expect(logoStyles.some((s) => s.id === 'logo-collage')).toBe(true);
      expect(logoStyles.some((s) => s.id === 'logo-chinese-calligraphy')).toBe(true);
      expect(logoStyles.some((s) => s.id === 'logo-neon')).toBe(true);
    });

    it('should handle category with multiple tag filters', () => {
      // Cartoon category should include styles with any of: cartoon, 2d-cartoon, anime, 3d
      const cartoonStyles = getStylesForCategory('cartoon');

      expect(cartoonStyles.length).toBeGreaterThan(0);

      cartoonStyles.forEach((style) => {
        const hasRelevantTag = style.tags.some((tag) => ['2d-cartoon', '3d', 'anime', 'cartoon'].includes(tag));

        expect(hasRelevantTag).toBe(true);
      });
    });

    it('should return empty array for non-existent category', () => {
      const styles = getStylesForCategory('non-existent-category');

      expect(styles).toEqual([]);
    });

    it('should return empty array for non-existent style in getCategoriesForStyle', () => {
      const categories = getCategoriesForStyle('non-existent-style' as any);

      expect(categories).toEqual([]);
    });
  });

  describe('specific category tests', () => {
    it('should place plain style in Customize category', () => {
      const customizeStyles = getStylesForCategory('customize');
      const hasPlain = customizeStyles.some((s) => s.id === 'plain');

      expect(hasPlain).toBe(true);
    });

    it('should include line art styles in Line Art category', () => {
      const lineArtStyles = getStylesForCategory('line-art');

      expect(lineArtStyles.some((s) => s.id === 'edit-photo-to-line')).toBe(true);
      expect(lineArtStyles.some((s) => s.id === 'edit-photo-to-line-outline')).toBe(true);
    });

    it('should include calligraphy in both Logo and Typography categories', () => {
      const logoStyles = getStylesForCategory('logo');
      const typographyStyles = getStylesForCategory('typography');

      expect(logoStyles.some((s) => s.id === 'logo-chinese-calligraphy')).toBe(true);
      expect(typographyStyles.some((s) => s.id === 'logo-chinese-calligraphy')).toBe(true);
    });

    it('should include neon logo in both Logo and Contemporary categories', () => {
      const logoStyles = getStylesForCategory('logo');
      const contemporaryStyles = getStylesForCategory('contemporary');

      expect(logoStyles.some((s) => s.id === 'logo-neon')).toBe(true);
      expect(contemporaryStyles.some((s) => s.id === 'logo-neon')).toBe(true);
    });

    it('should include artistic styles in Artistry category', () => {
      const artistryStyles = getStylesForCategory('artistry');

      expect(artistryStyles.some((s) => s.id === 'logo-crafty')).toBe(true);
      expect(artistryStyles.some((s) => s.id === 'logo-collage')).toBe(true);
      expect(artistryStyles.some((s) => s.id === 'edit-photo-to-line')).toBe(true);
    });
  });

  describe('helper functions', () => {
    it('should return all categories for a multi-tagged style', () => {
      const categories = getCategoriesForStyle('logo-cute');

      expect(categories.length).toBeGreaterThan(1);
      expect(categories.every((c) => c.id && c.displayName)).toBe(true);
    });

    it('should return at least one category for every style', () => {
      ALL_STYLES.forEach((style) => {
        const categories = getCategoriesForStyle(style.id);

        expect(categories.length).toBeGreaterThan(0);
      });
    });

    it('should ensure every category has at least one style', () => {
      CATEGORIES.forEach((category) => {
        const styles = getStylesForCategory(category.id);

        expect(styles.length).toBeGreaterThan(0);
      });
    });
  });

  describe('cross-file consistency', () => {
    it('should ensure all STYLE_PRESET_KEYS exist in ALL_STYLES', () => {
      const styleIds = ALL_STYLES.map((s) => s.id);

      STYLE_PRESET_KEYS.forEach((presetKey) => {
        expect(styleIds).toContain(presetKey);
      });
    });

    it('should ensure all styles in ALL_STYLES have valid preset keys', () => {
      ALL_STYLES.forEach((style) => {
        expect(STYLE_PRESET_KEYS).toContain(style.id);
      });
    });
  });
});
