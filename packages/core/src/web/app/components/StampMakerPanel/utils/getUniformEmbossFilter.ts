const HIGHLIGHT_PIXEL_VALUE = 192; // 192 or 256

/**
 * Creates a Konva filter for a uniform, non-directional emboss effect
 * with fine-tuned control over the gradient ramp.
 *
 * @param {object} options
 * @param {number} options.rampWidth - The total width of the embossed edge in pixels. A smaller value creates a faster, sharper transition.
 * @param {number} options.steps - The number of discrete shading steps. A larger value creates more layers and a smoother gradient.
 */
export const getUniformEmbossFilter =
  ({ rampWidth = 1, steps = 128 }: { rampWidth?: number; steps?: number }) =>
  (imageData: ImageData): void => {
    if (rampWidth <= 0 || steps <= 0) {
      return;
    }

    const { data, height, width } = imageData;

    const grid = new Float32Array(width * height);

    // Step 1: Initialize Grid (Measure from the WHITE background)
    for (let i = 0; i < width * height; i++) {
      grid[i] = data[i * 4] === 255 ? 0 : Infinity;
    }

    // Step 2 & 3: Run the two-pass Distance Transform
    // (This part remains the same)
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

    // --- Step 4: Render the Full-Range Stepped Emboss Effect ---
    for (let i = 0; i < width * height; i++) {
      const i4 = i * 4;
      const originalIsBlack = data[i4] === 0;
      const distance = grid[i];

      let color = originalIsBlack ? 0 : 255; // Default to original color

      if (originalIsBlack && distance > 0 && distance < rampWidth) {
        // This pixel is on an embossed edge.
        const stepWidth = rampWidth / steps;
        const currentStep = Math.floor(distance / stepWidth);

        // This new formula creates a full ramp from white (255) down to black (0).
        // The ramp starts at the brightest value and darkens with each step.
        color = HIGHLIGHT_PIXEL_VALUE - ((currentStep + 1) / (steps + 1)) * HIGHLIGHT_PIXEL_VALUE;
      } else if (!originalIsBlack) {
        color = 255; // Background remains white
      } else {
        color = 0; // Flat top of the stamp remains black
      }

      data[i4] = data[i4 + 1] = data[i4 + 2] = color;
      data[i4 + 3] = 255;
    }
  };
