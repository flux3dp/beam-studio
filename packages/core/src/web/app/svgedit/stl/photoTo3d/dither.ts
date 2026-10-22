/**
 * Photo → dot grid for photo-to-3D, ported from the replicate-3d-compare test page (`ditherImage`,
 * `unsharpMask`): resample the photo onto the dot grid, optionally sharpen, invert and
 * Floyd–Steinberg dither. A dot is where the laser fires, and a dot shows white inside the crystal,
 * so bright areas get more dots: the image is inverted and its dark (= originally bright) pixels
 * become dots.
 */

export type RasterData = { data: ArrayLike<number>; height: number; width: number };

export interface Dither {
  /** 1 where a dot is fired, row-major `width × height`. */
  dots: Uint8Array;
  height: number;
  width: number;
}

const FLOYD_STEINBERG = [
  [1, 0, 7 / 16],
  [-1, 1, 3 / 16],
  [0, 1, 5 / 16],
  [1, 1, 1 / 16],
] as const;

/**
 * One box blur of radius `r`, edges clamped. The vertical pass keeps a running sum per column and
 * walks the rows in order: going down a column instead misses the cache on every pixel of a
 * multi-million-cell grid.
 */
const boxBlurPass = (
  buf: Float32Array,
  tmp: Float32Array,
  sums: Float64Array,
  w: number,
  h: number,
  r: number,
): void => {
  const norm = 1 / (2 * r + 1);

  for (let y = 0; y < h; y += 1) {
    const row = y * w;
    let sum = 0;

    for (let k = -r; k <= r; k += 1) sum += buf[row + Math.min(w - 1, Math.max(0, k))];

    for (let x = 0; x < w; x += 1) {
      tmp[row + x] = sum * norm;
      sum += buf[row + Math.min(w - 1, x + r + 1)] - buf[row + Math.max(0, x - r)];
    }
  }

  sums.fill(0);

  for (let k = -r; k <= r; k += 1) {
    const row = Math.min(h - 1, Math.max(0, k)) * w;

    for (let x = 0; x < w; x += 1) sums[x] += tmp[row + x];
  }

  for (let y = 0; y < h; y += 1) {
    const row = y * w;
    const add = Math.min(h - 1, y + r + 1) * w;
    const remove = Math.max(0, y - r) * w;

    for (let x = 0; x < w; x += 1) {
      buf[row + x] = sums[x] * norm;
      sums[x] += tmp[add + x] - tmp[remove + x];
    }
  }
};

/** Three box passes approximate a Gaussian of `sigma` (in grid cells). In place. */
export const gaussianBlur = (buf: Float32Array, w: number, h: number, sigma: number): void => {
  const r = Math.max(1, Math.round((Math.sqrt(4 * sigma * sigma + 1) - 1) / 2));
  const tmp = new Float32Array(w * h);
  const sums = new Float64Array(w);

  for (let pass = 0; pass < 3; pass += 1) boxBlurPass(buf, tmp, sums, w, h, r);
};

/**
 * In place: `value += amount × (value − blur)`, unclamped. The blur is weighted by `weight` (0–1
 * coverage), so the transparent background does not darken or lighten the cut-out edge.
 */
export const unsharpMask = (
  value: Float32Array,
  weight: Float32Array,
  w: number,
  h: number,
  amount: number,
  sigma: number,
): void => {
  const n = w * h;
  const weightBlur = Float32Array.from(weight);
  const blur = new Float32Array(n);

  gaussianBlur(weightBlur, w, h, sigma);

  for (let i = 0; i < n; i += 1) blur[i] = value[i] * weight[i];

  gaussianBlur(blur, w, h, sigma);

  for (let i = 0; i < n; i += 1) {
    const b = weightBlur[i] > 1e-6 ? blur[i] / weightBlur[i] : value[i];

    value[i] += amount * (value[i] - b);
  }
};

/**
 * The photo's luminance (0 black – 1 white, alpha-weighted) and alpha coverage on a `w × h` grid: a box
 * average when the grid is coarser than the photo, bilinear when it is finer (the dot pitch usually is:
 * 0.03 mm over a 100 mm photo is 3300 dots across).
 */
const resample = (pixels: RasterData, w: number, h: number): { coverage: Float32Array; value: Float32Array } => {
  const { data, height, width } = pixels;
  const value = new Float32Array(w * h);
  const coverage = new Float32Array(w * h);
  const luminance = (o: number) => (0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2]) / 255;

  if (w <= width && h <= height) {
    for (let y = 0; y < h; y += 1) {
      const sy0 = Math.floor((y * height) / h);
      const sy1 = Math.max(sy0 + 1, Math.floor(((y + 1) * height) / h));

      for (let x = 0; x < w; x += 1) {
        const sx0 = Math.floor((x * width) / w);
        const sx1 = Math.max(sx0 + 1, Math.floor(((x + 1) * width) / w));
        let lum = 0;
        let alpha = 0;

        for (let sy = sy0; sy < sy1; sy += 1) {
          for (let sx = sx0; sx < sx1; sx += 1) {
            const o = (sy * width + sx) * 4;
            const a = data[o + 3] / 255;

            lum += a * luminance(o);
            alpha += a;
          }
        }

        const i = y * w + x;

        value[i] = alpha > 0 ? lum / alpha : 0;
        coverage[i] = alpha / ((sy1 - sy0) * (sx1 - sx0));
      }
    }

    return { coverage, value };
  }

  for (let y = 0; y < h; y += 1) {
    const fy = Math.min(height - 1, Math.max(0, ((y + 0.5) / h) * height - 0.5));
    const y0 = Math.floor(fy);
    const y1 = Math.min(height - 1, y0 + 1);
    const ty = fy - y0;

    for (let x = 0; x < w; x += 1) {
      const fx = Math.min(width - 1, Math.max(0, ((x + 0.5) / w) * width - 0.5));
      const x0 = Math.floor(fx);
      const x1 = Math.min(width - 1, x0 + 1);
      const tx = fx - x0;
      let lum = 0;
      let alpha = 0;
      const corner = (sx: number, sy: number, k: number) => {
        const o = (sy * width + sx) * 4;
        const a = (data[o + 3] / 255) * k;

        lum += a * luminance(o);
        alpha += a;
      };

      corner(x0, y0, (1 - tx) * (1 - ty));
      corner(x1, y0, tx * (1 - ty));
      corner(x0, y1, (1 - tx) * ty);
      corner(x1, y1, tx * ty);

      const i = y * w + x;

      value[i] = alpha > 0 ? lum / alpha : 0;
      coverage[i] = alpha;
    }
  }

  return { coverage, value };
};

/**
 * Dither the photo onto a `w × h` dot grid. Cells less than half covered (the removed background) get
 * no dots, and the error only spreads between covered cells so the cut-out edge does not bleed.
 * @param sharpen unsharp mask on the grid before dithering; the radius is in dots, amount 0 is off
 */
export const ditherPhoto = (
  pixels: RasterData,
  w: number,
  h: number,
  sharpen: { amount: number; radius: number },
): Dither => {
  const { coverage, value } = resample(pixels, w, h);
  const opaque = new Uint8Array(w * h);

  for (let i = 0; i < w * h; i += 1) opaque[i] = coverage[i] >= 0.5 ? 1 : 0;

  if (sharpen.amount > 0) unsharpMask(value, coverage, w, h, sharpen.amount, sharpen.radius);

  for (let i = 0; i < w * h; i += 1) value[i] = 1 - Math.min(1, Math.max(0, value[i]));

  const dots = new Uint8Array(w * h);

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = y * w + x;

      if (!opaque[i]) continue;

      const v = value[i];
      const black = v < 0.5;

      if (black) dots[i] = 1;

      const err = v - (black ? 0 : 1);

      for (let k = 0; k < FLOYD_STEINBERG.length; k += 1) {
        const [dx, dy, weight] = FLOYD_STEINBERG[k];
        const nx = x + dx;
        const ny = y + dy;

        if (nx < 0 || nx >= w || ny >= h) continue;

        const n = ny * w + nx;

        if (opaque[n]) value[n] += err * weight;
      }
    }
  }

  return { dots, height: h, width: w };
};
