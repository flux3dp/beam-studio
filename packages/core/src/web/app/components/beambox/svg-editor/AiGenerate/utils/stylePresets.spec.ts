import { getStylePreset, STYLE_PRESET_KEYS } from './stylePresets';

describe('stylePresets', () => {
  describe('STYLE_PRESET_KEYS', () => {
    it('should have correct style preset keys', () => {
      expect(STYLE_PRESET_KEYS).toEqual([
        'text-to-image-plain',
        'edit-plain',
        'edit-american-2d-cartoon',
        'edit-japanese-anime',
        'edit-photo-to-line',
        'edit-photo-to-line-outline',
        'edit-pixar-3d',
        'logo-cute',
        'logo-crafty',
        'logo-collage',
        'logo-chinese-calligraphy',
        'logo-neon',
      ]);
    });

    it('should have 12 style presets', () => {
      expect(STYLE_PRESET_KEYS).toHaveLength(12);
    });
  });

  describe('getStylePreset', () => {
    it('should return input fields for text-to-image-plain', () => {
      const preset = getStylePreset('text-to-image-plain');

      expect(preset).toHaveLength(1);
      expect(preset[0].key).toBe('description');
      expect(preset[0].label).toBe('Pattern Description');
    });

    it('should return input fields for edit-plain', () => {
      const preset = getStylePreset('edit-plain');

      expect(preset).toHaveLength(1);
      expect(preset[0].key).toBe('description');
      expect(preset[0].label).toBe('Edit Prompt');
    });

    it('should return input fields for logo-cute', () => {
      const preset = getStylePreset('logo-cute');

      expect(preset).toHaveLength(2);
      expect(preset[0].key).toBe('description');
      expect(preset[1].key).toBe('textToDisplay');
    });

    it('should return input fields for logo-crafty', () => {
      const preset = getStylePreset('logo-crafty');

      expect(preset).toHaveLength(2);
      expect(preset[0].key).toBe('description');
      expect(preset[1].key).toBe('textToDisplay');
    });

    it('should return input fields for logo-collage', () => {
      const preset = getStylePreset('logo-collage');

      expect(preset).toHaveLength(2);
      expect(preset[0].key).toBe('description');
      expect(preset[1].key).toBe('textToDisplay');
    });

    it('should return input fields for edit-american-2d-cartoon', () => {
      const preset = getStylePreset('edit-american-2d-cartoon');

      expect(preset).toHaveLength(1);
      expect(preset[0].key).toBe('description');
      expect(preset[0].placeholder).toContain('edit the images');
    });

    it('should return empty array for invalid preset key', () => {
      const preset = getStylePreset('invalid-key' as any);

      expect(preset).toEqual([]);
    });

    it('should include required flag in fields', () => {
      const preset = getStylePreset('text-to-image-plain');

      expect(preset[0].required).toBe(true);
    });

    it('should include maxLength in fields', () => {
      const preset = getStylePreset('text-to-image-plain');

      expect(preset[0].maxLength).toBe(5000);
    });

    it('should have different placeholder for edit vs text-to-image', () => {
      const textToImagePreset = getStylePreset('text-to-image-plain');
      const editPreset = getStylePreset('edit-plain');

      expect(textToImagePreset[0].placeholder).toContain('logo pattern');
      expect(editPreset[0].placeholder).toContain('edit the images');
    });

    it('should have consistent textToDisplay field across logo styles', () => {
      const cutePreset = getStylePreset('logo-cute');
      const craftyPreset = getStylePreset('logo-crafty');
      const collagePreset = getStylePreset('logo-collage');

      expect(cutePreset[1].key).toBe('textToDisplay');
      expect(craftyPreset[1].key).toBe('textToDisplay');
      expect(collagePreset[1].key).toBe('textToDisplay');
    });
  });
});
