/**
 * Creates a Konva filter to apply a stepped bevel effect using a more accurate
 * Euclidean Distance Transform. This produces a chiseled, ramp-like appearance.
 *
 * This filter should be applied to a binarized (black and white) image.
 *
 * @param {object} options
 * @param {number} options.rampWidth - The total width of the bevel ramp in pixels.
 * @param {number} options.steps - The number of discrete shading steps in the ramp.
 * @param {number} [options.lightAngle=315] - The angle of the light source in degrees.
 */
export const getEuclideanDistanceTransformFilter =
  ({ lightAngle = 315, rampWidth = 1, steps = 1 }) =>
  (imageData: ImageData): void => {
    if (rampWidth <= 0 || steps <= 0) {
      return;
    }

    const { data, height, width } = imageData;

    // We'll use a 2D grid to store distance values. Using two grids for clarity.
    const grid = new Float32Array(width * height);

    // --- Step 1: Initialize Grid ---
    // If a pixel is black (feature), set its distance to 0, otherwise Infinity.
    for (let i = 0; i < width * height; i++) {
      grid[i] = data[i * 4] === 0 ? 0 : Infinity;
    }

    // --- Step 2: First Pass (Top-down, Left-right) ---
    // This pass includes diagonal neighbors for a better Euclidean approximation.
    for (let y = 1; y < height; y++) {
      for (let x = 1; x < width; x++) {
        const i = y * width + x;
        const dist_top = grid[(y - 1) * width + x] + 1;
        const dist_left = grid[y * width + x - 1] + 1;
        const dist_top_left = grid[(y - 1) * width + x - 1] + Math.SQRT2; // Diagonal

        grid[i] = Math.min(grid[i], dist_top, dist_left, dist_top_left);
      }
    }

    // --- Step 3: Second Pass (Bottom-up, Right-left) ---
    // This pass finalizes the distance calculation.
    for (let y = height - 2; y >= 0; y--) {
      for (let x = width - 2; x >= 0; x--) {
        const i = y * width + x;
        const dist_bottom = grid[(y + 1) * width + x] + 1;
        const dist_right = grid[y * width + x + 1] + 1;
        const dist_bottom_right = grid[(y + 1) * width + x + 1] + Math.SQRT2; // Diagonal

        grid[i] = Math.min(grid[i], dist_bottom, dist_right, dist_bottom_right);
      }
    }

    // --- Step 4: Render the Stepped Bevel ---
    const rad = ((lightAngle % 360) * Math.PI) / 180;
    const lightX = Math.cos(rad);
    const lightY = Math.sin(rad);

    for (let i = 0; i < width * height; i++) {
      const i4 = i * 4;
      const distance = grid[i];

      let color = 128; // Default to mid-gray

      if (distance > 0 && distance < rampWidth) {
        // Find the distance gradient for lighting
        const dx = (grid[i + 1] || grid[i]) - (grid[i - 1] || grid[i]);
        const dy = (grid[i + width] || grid[i]) - (grid[i - width] || grid[i]);
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        const normDx = magnitude === 0 ? 0 : dx / magnitude;
        const normDy = magnitude === 0 ? 0 : dy / magnitude;
        const lightIntensity = normDx * lightX + normDy * lightY;

        // Quantize the distance into discrete steps
        const stepWidth = rampWidth / steps;
        const currentStep = Math.floor(distance / stepWidth);

        // Calculate color based on the step and lighting
        const baseRampColor = 255 - ((currentStep + 1) / (steps + 1)) * 255;

        color = baseRampColor + lightIntensity * (255 - baseRampColor) * 0.6;
      } else if (distance >= rampWidth) {
        // Outside the ramp, make it white
        color = 255;
      } else {
        // The original black stamp area
        color = 0;
      }

      data[i4] = data[i4 + 1] = data[i4 + 2] = color;
      data[i4 + 3] = 255;
    }
  };
