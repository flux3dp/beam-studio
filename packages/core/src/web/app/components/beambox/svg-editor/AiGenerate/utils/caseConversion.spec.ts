import { objectToCamelCase, objectToSnakeCase, toCamelCase, toSnakeCase } from './caseConversion';

describe('caseConversion', () => {
  describe('toSnakeCase', () => {
    it('should convert camelCase to snake_case', () => {
      expect(toSnakeCase('textToDisplay')).toBe('text_to_display');
      expect(toSnakeCase('imageResolution')).toBe('image_resolution');
      expect(toSnakeCase('maxImages')).toBe('max_images');
    });

    it('should handle single word', () => {
      expect(toSnakeCase('description')).toBe('description');
    });

    it('should handle multiple capitals', () => {
      expect(toSnakeCase('imageURLPath')).toBe('image_u_r_l_path');
    });
  });

  describe('toCamelCase', () => {
    it('should convert snake_case to camelCase', () => {
      expect(toCamelCase('text_to_display')).toBe('textToDisplay');
      expect(toCamelCase('image_resolution')).toBe('imageResolution');
      expect(toCamelCase('max_images')).toBe('maxImages');
    });

    it('should handle single word', () => {
      expect(toCamelCase('description')).toBe('description');
    });

    it('should handle multiple underscores', () => {
      expect(toCamelCase('image_url_path')).toBe('imageUrlPath');
    });
  });

  describe('objectToSnakeCase', () => {
    it('should convert object keys to snake_case', () => {
      const input = {
        description: 'Test',
        textToDisplay: 'MeowWoof',
      };

      const result = objectToSnakeCase(input);

      expect(result).toEqual({
        description: 'Test',
        text_to_display: 'MeowWoof',
      });
    });

    it('should handle empty object', () => {
      expect(objectToSnakeCase({})).toEqual({});
    });
  });

  describe('objectToCamelCase', () => {
    it('should convert object keys to camelCase', () => {
      const input = {
        description: 'Test',
        text_to_display: 'MeowWoof',
      };

      const result = objectToCamelCase(input);

      expect(result).toEqual({
        description: 'Test',
        textToDisplay: 'MeowWoof',
      });
    });

    it('should handle empty object', () => {
      expect(objectToCamelCase({})).toEqual({});
    });
  });
});
