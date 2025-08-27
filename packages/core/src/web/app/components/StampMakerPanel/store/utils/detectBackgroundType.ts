/**
 * Determines the dominant background type of an image by analyzing the edge pixels.
 * This is important for stamp making because different background types require different bevel filters.
 */
export type BackgroundType = 'black' | 'white';

/**
 * Analyzes an image to determine if it has predominantly black or white background.
 * Uses edge pixel sampling to determine background type.
 *
 * @param imageData - The ImageData from a canvas containing the grayscale image
 * @returns 'black' if the image has predominantly black background, 'white' for white background
 */
export const detectBackgroundType = (imageData: ImageData): BackgroundType => {
  const { data, height, width } = imageData;
  const edgePixels: number[] = [];
  const threshold = 128; // Middle gray value for classification

  // Sample pixels around the edges of the image
  // Top and bottom edges
  for (let x = 0; x < width; x += 5) {
    // Top edge
    const topIndex = x * 4;

    edgePixels.push(data[topIndex]); // R value (since it's grayscale, R=G=B)

    // Bottom edge
    const bottomIndex = ((height - 1) * width + x) * 4;

    edgePixels.push(data[bottomIndex]);
  }

  // Left and right edges (skip corners to avoid double counting)
  for (let y = 5; y < height - 5; y += 5) {
    // Left edge
    const leftIndex = y * width * 4;

    edgePixels.push(data[leftIndex]);

    // Right edge
    const rightIndex = (y * width + width - 1) * 4;

    edgePixels.push(data[rightIndex]);
  }

  // Count pixels that are closer to white vs black
  let whiteCount = 0;
  let blackCount = 0;

  edgePixels.forEach((pixel) => {
    if (pixel > threshold) {
      whiteCount++;
    } else {
      blackCount++;
    }
  });

  // Determine dominant background type
  return whiteCount > blackCount ? 'white' : 'black';
};
