/**
 * Configuration for the multi-stage ramp effect.
 */
const RAMP_CONFIG = {
  DARK_GRAY: 0, // The color at the deepest part of the ramp
  LIGHT_GRAY: 192, // The highlight color at the very edge
  MID_POINT: 0.3, // The point where the ramp changes speed (30%)
  MIDDLE_GRAY: 128, // The color at the transition point
};

/**
 * Calculates the color for a pixel based on its distance along a multi-stage ramp.
 * @param distance The pixel's distance from the nearest edge.
 * @param rampWidth The total width of the ramp.
 * @param steps The total number of steps in the ramp.
 * @returns The calculated grayscale color value (0-255).
 */
const getColorOnMultiStageRamp = (distance: number, rampWidth: number, steps: number): number => {
  const { DARK_GRAY, LIGHT_GRAY, MID_POINT, MIDDLE_GRAY } = RAMP_CONFIG;
  const stepWidth = rampWidth / steps;
  const currentStep = Math.floor(distance / stepWidth);
  const linearProgress = (currentStep + 1) / (steps + 1);
  const darkToMidRange = MIDDLE_GRAY - DARK_GRAY;
  const midToLightRange = LIGHT_GRAY - MIDDLE_GRAY;

  if (linearProgress < MID_POINT) {
    const progressInFirstHalf = linearProgress / MID_POINT;

    return DARK_GRAY + progressInFirstHalf * darkToMidRange;
  } else {
    const progressInSecondHalf = (linearProgress - MID_POINT) / (1 - MID_POINT);

    return MIDDLE_GRAY + progressInSecondHalf * midToLightRange;
  }
};

/**
 * Creates a Konva filter for a uniform, non-directional bevel (engraved) effect
 * with a non-linear, multi-stage ramp.
 *
 * @param {object} options
 * @param {number} [options.rampWidth=10] - The width of the edge ramp in pixels.
 * @param {number} [options.steps=128] - The number of discrete shading steps.
 * @param {number} [options.threshold=128] - The brightness level (0-255) to distinguish background from foreground.
 */
export const createExpandFilter =
  ({ rampWidth = 10, steps = 128, threshold = 128 }: { rampWidth?: number; steps?: number; threshold?: number }) =>
  (imageData: ImageData): void => {
    if (rampWidth <= 0 || steps <= 0) return;

    const { data, height, width } = imageData;
    const grid = new Float32Array(width * height);
    const originalData = new Uint8ClampedArray(data); // Keep a copy of the original pixels

    // --- Steps 1, 2, & 3: Calculate Euclidean Distance Transform ---
    for (let i = 0; i < width * height; i++) {
      grid[i] = originalData[i * 4] < threshold ? 0 : Infinity;
    }
    // First Pass
    for (let y = 1; y < height; y++) {
      for (let x = 1; x < width; x++) {
        const i = y * width + x;
        const distTop = grid[(y - 1) * width + x] + 1;
        const distLeft = grid[y * width + x - 1] + 1;
        const distTopLeft = grid[(y - 1) * width + x - 1] + Math.SQRT2;

        grid[i] = Math.min(grid[i], distTop, distLeft, distTopLeft);
      }
    }
    // Second Pass
    for (let y = height - 2; y >= 0; y--) {
      for (let x = width - 2; x >= 0; x--) {
        const i = y * width + x;
        const distBottom = grid[(y + 1) * width + x] + 1;
        const distRight = grid[y * width + x + 1] + 1;
        const distBottomRight = grid[(y + 1) * width + x + 1] + Math.SQRT2;

        grid[i] = Math.min(grid[i], distBottom, distRight, distBottomRight);
      }
    }

    // --- Step 4: Render the Final Image using the Helper Function ---
    for (let i = 0; i < width * height; i++) {
      const i4 = i * 4;
      const distance = grid[i];
      const originalColor = originalData[i4];
      let color = originalColor;

      if (originalColor >= threshold && distance > 0 && distance < rampWidth) {
        color = getColorOnMultiStageRamp(distance, rampWidth, steps);
      } else if (distance === 0) {
        color = 0;
      } else {
        color = 255;
      }

      data[i4] = data[i4 + 1] = data[i4 + 2] = color;
      data[i4 + 3] = 255;
    }
  };
