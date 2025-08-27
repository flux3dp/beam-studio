/**
 * Configuration for the multi-stage shrink/emboss effect.
 * The ramp transitions from a highlight to a mid-tone, then to black.
 */
const RAMP_CONFIG = {
  DARK_GRAY: 0, // The color at the deepest part of the ramp
  LIGHT_GRAY: 256, // The highlight color at the very edge
  MID_POINT: 0.3, // The point where the ramp changes speed (30%)
  MIDDLE_GRAY: 128, // The color at the transition point
};

/**
 * Calculates the color for a pixel on the shrink/emboss ramp.
 * @param distance The pixel's distance from the nearest white edge.
 * @param rampWidth The total width of the ramp.
 * @param steps The total number of steps in the ramp.
 * @returns The calculated grayscale color value (0-255).
 */
const getColorOnShrinkRamp = (distance: number, rampWidth: number, steps: number): number => {
  const { DARK_GRAY, LIGHT_GRAY, MID_POINT, MIDDLE_GRAY } = RAMP_CONFIG;

  const stepWidth = rampWidth / steps;
  const currentStep = Math.floor(distance / stepWidth);
  const linearProgress = (currentStep + 1) / (steps + 1);

  const lightToMidRange = LIGHT_GRAY - MIDDLE_GRAY;
  const midToDarkRange = MIDDLE_GRAY - DARK_GRAY;

  if (linearProgress < MID_POINT) {
    // First, faster part of the ramp (Light Gray -> Mid Gray)
    const progressInFirstHalf = linearProgress / MID_POINT;

    return LIGHT_GRAY - progressInFirstHalf * lightToMidRange;
  } else {
    // Second, slower part of the ramp (Mid Gray -> Dark Gray/Black)
    const progressInSecondHalf = (linearProgress - MID_POINT) / (1 - MID_POINT);

    return MIDDLE_GRAY - progressInSecondHalf * midToDarkRange;
  }
};

/**
 * Creates a Konva filter for a uniform, non-directional shrink (emboss) effect
 * with a non-linear, multi-stage ramp.
 *
 * @param {object} options
 * @param {number} options.rampWidth - The total width of the edge in pixels.
 * @param {number} options.steps - The number of discrete shading steps.
 */
export const createShrinkFilter =
  ({ rampWidth = 10, steps = 128 }: { rampWidth?: number; steps?: number }) =>
  (imageData: ImageData): void => {
    if (rampWidth <= 0) return;

    const { data, height, width } = imageData;
    const grid = new Float32Array(width * height);

    // --- Steps 1, 2, & 3: Calculate Euclidean Distance Transform ---
    // (This measures from the WHITE background to create the shrink/emboss effect)
    for (let i = 0; i < width * height; i++) {
      grid[i] = data[i * 4] === 255 ? 0 : Infinity;
    }
    // First Pass
    for (let y = 1; y < height; y++) {
      for (let x = 1; x < width; x++) {
        const i = y * width + x;
        const dist_top = grid[(y - 1) * width + x] + 1;
        const dist_left = grid[y * width + x - 1] + 1;
        const dist_top_left = grid[(y - 1) * width + x - 1] + Math.SQRT2;

        grid[i] = Math.min(grid[i], dist_top, dist_left, dist_top_left);
      }
    }
    // Second Pass
    for (let y = height - 2; y >= 0; y--) {
      for (let x = width - 2; x >= 0; x--) {
        const i = y * width + x;
        const dist_bottom = grid[(y + 1) * width + x] + 1;
        const dist_right = grid[y * width + x + 1] + 1;
        const dist_bottom_right = grid[(y + 1) * width + x + 1] + Math.SQRT2;

        grid[i] = Math.min(grid[i], dist_bottom, dist_right, dist_bottom_right);
      }
    }

    // --- Step 4: Render the Final Image using the Helper Function ---
    for (let i = 0; i < width * height; i++) {
      const i4 = i * 4;
      const originalIsBlack = data[i4] === 0;
      const distance = grid[i];
      let color = originalIsBlack ? 0 : 255;

      if (originalIsBlack && distance > 0 && distance < rampWidth) {
        color = getColorOnShrinkRamp(distance, rampWidth, steps);
      } else if (!originalIsBlack) {
        color = 255; // White background
      } else {
        color = 0; // Flat top of the stamp
      }

      data[i4] = data[i4 + 1] = data[i4 + 2] = color;
      data[i4 + 3] = 255;
    }
  };
