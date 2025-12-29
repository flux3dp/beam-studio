/**
 * File validation utilities for image uploads
 */

import { sum } from 'remeda';
import { sprintf } from 'sprintf-js';

import i18n from '@core/helpers/i18n';

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
  const t = i18n.lang.beambox.ai_generate;

  if (sum([currentCount, files.length]) > maxImages) {
    return sprintf(t.validation.max_images, String(maxImages));
  }

  for (const file of files) {
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      return sprintf(t.upload.file_type_error, file.name);
    }

    if (file.size > maxSizeBytes) {
      return sprintf(t.upload.file_size_error, file.name, String((maxSizeBytes / 1024 / 1024).toFixed(0)));
    }
  }

  return null;
};
