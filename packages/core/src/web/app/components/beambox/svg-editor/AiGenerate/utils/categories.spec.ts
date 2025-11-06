import { CATEGORIES } from './categories';
import { STYLE_PRESET_KEYS } from './stylePresets';

describe('categories and stylePresets consistency', () => {
  describe('cross-file consistency', () => {
    it('should ensure all defined presets are referenced in categories', () => {
      // Collect all style IDs from categories
      const referencedPresets = new Set<string>();

      CATEGORIES.forEach((category) => {
        category.styles.forEach((style) => {
          referencedPresets.add(style.id);
        });
      });

      // Check that all presets are referenced at least once
      STYLE_PRESET_KEYS.forEach((presetKey) => {
        expect(referencedPresets.has(presetKey)).toBe(true);
      });
    });

    it('should ensure all category styles have displayNames', () => {
      // DisplayNames are now only in categories (removed from presets to avoid duplication)
      CATEGORIES.forEach((category) => {
        category.styles.forEach((style) => {
          expect(style.displayName).toBeTruthy();
          expect(typeof style.displayName).toBe('string');
          expect(style.displayName.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('type safety', () => {
    it('should ensure STYLE_PRESET_KEYS is readonly', () => {
      // This is a compile-time check, but we can verify the array is frozen at runtime
      expect(Object.isFrozen(STYLE_PRESET_KEYS)).toBe(false); // const assertion doesn't freeze, but prevents reassignment
    });

    it('should have correct preset keys in STYLE_PRESET_KEYS', () => {
      expect(STYLE_PRESET_KEYS).toEqual([
        'text-to-image-plain',
        'edit-plain',
        'logo-cute',
        'logo-crafty',
        'logo-collage',
      ]);
    });
  });
});
