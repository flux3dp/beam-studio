/**
 * Configuration for the multi-stage ramp effect.
 */
const RAMP_CONFIG = {
  DARK_GRAY: 0,
  LIGHT_GRAY: 192,
  MID_POINT: 0.3, // The point where the ramp changes slope
  MIDDLE_GRAY: 128,
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
    // First, faster part of the ramp
    const progressInFirstHalf = linearProgress / MID_POINT;

    return DARK_GRAY + progressInFirstHalf * darkToMidRange;
  } else {
    // Second, slower part of the ramp
    const progressInSecondHalf = (linearProgress - MID_POINT) / (1 - MID_POINT);

    return MIDDLE_GRAY + progressInSecondHalf * midToLightRange;
  }
};

/**
 * Creates a Konva filter for a uniform, non-directional bevel (engraved) effect
 * with a non-linear, multi-stage ramp.
 *
 * @param {object} options
 * @param {number} options.rampWidth - The total width of the edge in pixels.
 * @param {number} options.steps - The number of discrete shading steps.
 */
export const createExpandFilter =
  ({ rampWidth = 10, steps = 128 }: { rampWidth?: number; steps?: number }) =>
  (imageData: ImageData): void => {
    if (rampWidth <= 0 || steps <= 0) return;

    const { data, height, width } = imageData;
    const grid = new Float32Array(width * height);

    // --- Steps 1, 2, & 3: Calculate Euclidean Distance Transform ---
    for (let i = 0; i < width * height; i++) {
      grid[i] = data[i * 4] === 0 ? 0 : Infinity;
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
      let color = 0;

      if (distance > 0 && distance < rampWidth) {
        color = getColorOnMultiStageRamp(distance, rampWidth, steps);
      } else if (distance >= rampWidth) {
        color = 255; // White background
      } else {
        color = 0; // Original black shape
      }

      data[i4] = data[i4 + 1] = data[i4 + 2] = color;
      data[i4 + 3] = 255;
    }
  };
