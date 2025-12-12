import { ACCEPTED_IMAGE_TYPES, DEFAULT_MAX_IMAGES, DEFAULT_MAX_SIZE_BYTES, validateImageFiles } from './fileValidation';

const createMockFile = (name: string, type: string, _size: number): File =>
  new File([''], name, { type }) as File & { size: number };

// Override size property since File constructor doesn't support it directly
const mockFileWithSize = (name: string, type: string, size: number): File => {
  const file = createMockFile(name, type, size);

  Object.defineProperty(file, 'size', { value: size });

  return file;
};

describe('fileValidation', () => {
  describe('validateImageFiles', () => {
    it('returns null for valid files', () => {
      const files = [mockFileWithSize('test.jpg', 'image/jpeg', 1024)];

      expect(validateImageFiles(files, 0)).toBeNull();
    });

    it('returns error when exceeding max images', () => {
      const files = [mockFileWithSize('test.jpg', 'image/jpeg', 1024)];

      expect(validateImageFiles(files, DEFAULT_MAX_IMAGES)).toBe(`Maximum ${DEFAULT_MAX_IMAGES} images allowed`);
    });

    it('returns error for unsupported file type', () => {
      const files = [mockFileWithSize('test.gif', 'image/gif', 1024)];

      expect(validateImageFiles(files, 0)).toBe('test.gif: Only JPEG, PNG, and WebP images are supported');
    });

    it('returns error for file exceeding max size', () => {
      const largeFile = mockFileWithSize('large.jpg', 'image/jpeg', DEFAULT_MAX_SIZE_BYTES + 1);

      expect(validateImageFiles([largeFile], 0)).toBe('large.jpg: File size must be less than 10MB');
    });

    it('accepts all valid image types', () => {
      for (const type of ACCEPTED_IMAGE_TYPES) {
        const file = mockFileWithSize(`test.${type.split('/')[1]}`, type, 1024);

        expect(validateImageFiles([file], 0)).toBeNull();
      }
    });

    it('validates multiple files', () => {
      const files = [
        mockFileWithSize('a.jpg', 'image/jpeg', 1024),
        mockFileWithSize('b.png', 'image/png', 1024),
        mockFileWithSize('c.webp', 'image/webp', 1024),
      ];

      expect(validateImageFiles(files, 0)).toBeNull();
    });

    it('stops at first invalid file in batch', () => {
      const files = [
        mockFileWithSize('valid.jpg', 'image/jpeg', 1024),
        mockFileWithSize('invalid.gif', 'image/gif', 1024),
      ];

      expect(validateImageFiles(files, 0)).toBe('invalid.gif: Only JPEG, PNG, and WebP images are supported');
    });
  });
});
