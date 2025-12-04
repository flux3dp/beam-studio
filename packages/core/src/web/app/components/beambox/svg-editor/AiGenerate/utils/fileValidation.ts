/**
 * File validation utilities for image uploads
 */

export const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp';
export const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const DEFAULT_MAX_IMAGES = 10;

/**
 * Validates an array of files against size and type constraints
 * @returns Error message string if validation fails, null if valid
 */
export const validateImageFiles = (
  files: File[],
  currentCount: number,
  maxImages: number = DEFAULT_MAX_IMAGES,
  maxSizeBytes: number = DEFAULT_MAX_SIZE_BYTES,
): null | string => {
  if (currentCount + files.length > maxImages) {
    return `Maximum ${maxImages} images allowed`;
  }

  for (const file of files) {
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      return `${file.name}: Only JPEG, PNG, and WebP images are supported`;
    }

    if (file.size > maxSizeBytes) {
      return `${file.name}: File size must be less than ${(maxSizeBytes / 1024 / 1024).toFixed(0)}MB`;
    }
  }

  return null;
};
