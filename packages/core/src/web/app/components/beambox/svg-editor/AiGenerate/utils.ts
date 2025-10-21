/**
 * Format a timestamp to a relative time string (e.g., "2 hours ago")
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (timestamp: string): string => {
  const now = Date.now();
  const date = new Date(timestamp);
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';

  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;

  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;

  return `${days} day${days !== 1 ? 's' : ''} ago`;
};

/**
 * Get a human-readable label for image size
 * @param imageSize - API image size option
 * @returns Readable label
 */
export const getImageSizeLabel = (imageSize: string): string => {
  // Parse size format like "landscape_16_9" or "square_hd"
  if (imageSize.includes('square')) return 'Square';

  if (imageSize.includes('landscape')) return 'Landscape';

  if (imageSize.includes('portrait')) return 'Portrait';

  return imageSize;
};

/**
 * Get a human-readable label for aspect ratio from image size
 * @param imageSize - API image size option
 * @returns Aspect ratio label (e.g., "16:9")
 */
export const getAspectRatioLabel = (imageSize: string): string => {
  if (imageSize.includes('16_9')) return '16:9';

  if (imageSize.includes('4_3')) return '4:3';

  if (imageSize.includes('3_2')) return '3:2';

  if (imageSize.includes('21_9')) return '21:9';

  return '1:1';
};
