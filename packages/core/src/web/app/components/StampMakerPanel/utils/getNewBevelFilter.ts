/**
 * Applies a bevel effect to an image, operating directly on its ImageData.
 * This is a synchronous, pure JavaScript implementation of the provided bevel algorithm.
 *
 * @param {ImageData} imageData - The ImageData object to modify, containing { data, width, height }.
 * @param {object} options - The options for the bevel effect.
 * @param {number} options.bevelRadius - The radius for the blur effect that creates the bevel.
 * @param {number} [options.threshold=128] - The brightness threshold (0-255) for the initial black/white conversion.
 */
export const getNewBevelFilter =
  ({ bevelRadius, threshold = 128 }) =>
  ({ data, height, width }) => {
    if (typeof bevelRadius !== 'number' || bevelRadius <= 0) {
      console.error('A positive bevelRadius must be provided.');

      return;
    }

    // --- Internal Helper Functions (ported from your example) ---

    const getPixelIndex = (x, y) => (y * width + x) * 4;

    // 2. Blur Logic
    const oneDirectionalLinearBlur = (sourceData, r, dir) => {
      const blurred = new Uint8ClampedArray(sourceData);
      const r1 = r + 1;
      const interval = 0.3;
      const denominator = (1 + 1 + r * interval) * (r1 / 2);

      const iLimit = dir === 'left' || dir === 'right' ? height : width;
      const jLimit = dir === 'left' || dir === 'right' ? width : height;

      for (let i = 0; i < iLimit; i++) {
        let sumR = 0,
          sumG = 0,
          sumB = 0;
        let curR = 0,
          curG = 0,
          curB = 0;
        const windowR = [],
          windowG = [],
          windowB = [];

        for (let j = 0; j < jLimit; j++) {
          let x, y;

          if (dir === 'left') {
            x = width - 1 - j;
            y = i;
          } else if (dir === 'right') {
            x = j;
            y = i;
          } else if (dir === 'up') {
            x = i;
            y = height - 1 - j;
          } else {
            x = i;
            y = j;
          } // down

          const p = getPixelIndex(x, y);
          const rVal = sourceData[p];
          const gVal = sourceData[p + 1];
          const bVal = sourceData[p + 2];

          if (j === 0) {
            for (let k = 0; k < r1; k++) {
              windowR[k] = rVal;
              windowG[k] = gVal;
              windowB[k] = bVal;
            }
            sumR = rVal * r1;
            sumG = gVal * r1;
            sumB = bVal * r1;
            curR = rVal * denominator;
            curG = gVal * denominator;
            curB = bVal * denominator;
          } else {
            const lastR = windowR.shift();
            const lastG = windowG.shift();
            const lastB = windowB.shift();

            curR += rVal * (1 + r * interval) - lastR - interval * (sumR - lastR);
            curG += gVal * (1 + r * interval) - lastG - interval * (sumG - lastG);
            curB += bVal * (1 + r * interval) - lastB - interval * (sumB - lastB);
            sumR += rVal - lastR;
            sumG += gVal - lastG;
            sumB += bVal - lastB;
            windowR.push(rVal);
            windowG.push(gVal);
            windowB.push(bVal);
          }

          blurred[p] = Math.floor(curR / denominator);
          blurred[p + 1] = Math.floor(curG / denominator);
          blurred[p + 2] = Math.floor(curB / denominator);
          blurred[p + 3] = 255;
        }
      }

      return blurred;
    };

    const stampBlur = (sourceData, r) => {
      const rInt = Math.ceil(r);
      const left = oneDirectionalLinearBlur(sourceData, rInt, 'left');
      const right = oneDirectionalLinearBlur(sourceData, rInt, 'right');
      const up = oneDirectionalLinearBlur(sourceData, rInt, 'up');
      const down = oneDirectionalLinearBlur(sourceData, rInt, 'down');

      const result = new Uint8ClampedArray(sourceData.length);

      for (let i = 0; i < sourceData.length; i += 4) {
        result[i] = Math.min(left[i], right[i], up[i], down[i]);
        result[i + 1] = Math.min(left[i + 1], right[i + 1], up[i + 1], down[i + 1]);
        result[i + 2] = Math.min(left[i + 2], right[i + 2], up[i + 2], down[i + 2]);
        result[i + 3] = 255;
      }

      return result;
    };

    // 3. Regulate Blurred Image: Enhance contrast to create highlights/shadows.
    const regulate = (imgData) => {
      let min = 255,
        max = 0;

      for (let i = 0; i < imgData.length; i += 4) {
        const v = imgData[i];

        if (v < min) min = v;

        if (v > max) max = v;
      }

      const range = max - min;

      if (range === 0) return; // Avoid division by zero on flat images

      for (let i = 0; i < imgData.length; i += 4) {
        let v = (imgData[i] - min) / range; // Normalize
        let power;

        if (v < 0.3) {
          power = 1.5;
        } else if (v < 0.7) {
          power = 1.5 + 2.5 * (v - 0.3);
        } else {
          power = 2.5 + 5 * (v - 0.7);
        }

        const newVal = Math.round(v ** power * 255);

        imgData[i] = imgData[i + 1] = imgData[i + 2] = newVal;
        imgData[i + 3] = 255;
      }
    };

    // 4. Composite: Blend the regulated blur over the binarized image.
    const compositeOverlay = (target, bottom, top) => {
      for (let i = 0; i < target.length; i += 4) {
        // Only need to calculate for one channel since they are greyscale
        const bottomVal = bottom[i] / 255;
        const topVal = top[i] / 255;

        let result;

        if (bottomVal < 0.5) {
          result = 2 * bottomVal * topVal;
        } else {
          result = 1 - 2 * (1 - bottomVal) * (1 - topVal);
        }

        target[i] = result * 255;
        target[i + 1] = result * 255;
        target[i + 2] = result * 255;
        target[i + 3] = bottom[i + 3]; // Keep original alpha from binarized layer
      }
    };

    // --- Main Filter Execution ---

    // Step 1: Create a binarized version of the original image data.
    const binarizedLayer = new Uint8ClampedArray(data);

    // Step 2: Create a blurred version from the binarized data.
    const blurredLayer = stampBlur(binarizedLayer, bevelRadius);

    // Step 3: Regulate the blurred image to create the bevel highlights and shadows.
    regulate(blurredLayer);

    // Step 4: Composite the regulated blur over the binarized layer into the original `data` array.
    compositeOverlay(data, binarizedLayer, blurredLayer);
  };
