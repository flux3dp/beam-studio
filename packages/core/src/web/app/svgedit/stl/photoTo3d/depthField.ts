/**
 * Depth-field processing for photo-to-3D, ported from the replicate-3d-compare test page
 * (`fieldStats`, `makeFieldSampler`, `edgeCleanField` with the "只清輪廓" scope, `edgeDither` without
 * walls). Distances are in world millimetres of the object, so the slope thresholds mean the same at
 * any size: X and Y span the object, Z its thickness.
 *
 * The depth model reports distance from the camera, so the raised side of the relief is the near
 * side: depth is inverted on the way to Z.
 */
import type { DepthSource } from './depthSource';
import type { Dither, RasterData } from './dither';

/** Slope (mm/mm, ≈ 68°) above which a pixel may lie on an occlusion ramp. */
const EDGE_STEEP = 2.5;
/** Pixels searched on each side of a ramp for the two surfaces. */
const EDGE_REACH = 6;
/** Colour distance to the chosen side / to the other side. */
const EDGE_COLOR_RATIO = 0.6;
/** RGB distance between the two sides below which no side is chosen. */
const EDGE_COLOR_MIN = 30;
/** Pixels from the cut-out edge treated as fringe. */
const EDGE_FRINGE = 4;
/** Pixels from the cut-out that the cleanup works on; the inside keeps its ramps. */
const EDGE_BAND = 10;
/** Islands below this share of the valid pixels are merged. */
const EDGE_ISLAND = 0.0015;
/** Area factor (slope ≈ 80.5°) above which a dot cell spans a depth jump instead of a surface. */
const EDGE_MAX_AREA = 6.1;
/** The roll-off ends where the quarter circle's slope reaches 4 (≈ 76°). */
const EDGE_ROUND_T = 4 / Math.sqrt(17);
/** Width of the rim that is levelled, as a share of the photo's width. */
const EDGE_LEVEL_RATIO = 0.04;
/** The level a rim pixel is held to is the nearest its surroundings reach within this many rims. */
const EDGE_LEVEL_REACH = 2;
/** A rim pixel this far behind its level (share of the relief depth) is background, not subject... */
const EDGE_LEVEL_REMOVE = 0.4;
/** ...provided it also sits within this share of the depth from the far end. */
const EDGE_LEVEL_FAR = 0.15;
/** Extra dots per dot cell at most. */
const EDGE_MAX_EXTRA = 60;

export interface DepthStats {
  /** 1st percentile of the valid depth */
  lower: number;
  /** 99th percentile of the valid depth */
  upper: number;
  valid: number;
}

export interface DepthField {
  depth: Float32Array;
  height: number;
  mask: Uint8Array;
  width: number;
}

export const getDepthStats = ({ depth, mask }: Pick<DepthSource, 'depth' | 'mask'>): DepthStats => {
  let valid = 0;

  for (let i = 0; i < depth.length; i += 1) if (Number.isFinite(depth[i]) && mask[i]) valid += 1;

  const values = new Float32Array(valid);
  let j = 0;

  for (let i = 0; i < depth.length; i += 1) if (Number.isFinite(depth[i]) && mask[i]) values[j++] = depth[i];

  values.sort();

  const pct = (p: number) => values[Math.min(values.length - 1, Math.max(0, Math.round((values.length - 1) * p)))];

  return { lower: pct(0.01), upper: pct(0.99), valid };
};

const cubicWeights = (t: number, out: Float64Array): void => {
  const t2 = t * t;
  const t3 = t2 * t;

  out[0] = (-t3 + 2 * t2 - t) / 2;
  out[1] = (3 * t3 - 5 * t2 + 2) / 2;
  out[2] = (-3 * t3 + 4 * t2 + t) / 2;
  out[3] = (t3 - t2) / 2;
};

/**
 * Depth at fractional pixel coordinates: bicubic (Catmull-Rom) when the 4 × 4 neighbourhood is all
 * valid, otherwise bilinear over the valid corners, so the mask edge neither rings nor pulls in the
 * background. NaN when no neighbour is valid.
 */
export const makeDepthSampler = ({ depth, height, mask, width }: DepthField): ((x: number, y: number) => number) => {
  const valid = new Uint8Array(depth.length);

  for (let i = 0; i < depth.length; i += 1) valid[i] = Number.isFinite(depth[i]) && mask[i] > 0 ? 1 : 0;

  const ok = (i: number) => valid[i] === 1;
  const wx = new Float64Array(4);
  const wy = new Float64Array(4);

  return (x, y) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const tx = x - x0;
    const ty = y - y0;
    let all = true;
    let sum = 0;

    cubicWeights(tx, wx);
    cubicWeights(ty, wy);

    for (let j = 0; j < 4 && all; j += 1) {
      const row = Math.min(height - 1, Math.max(0, y0 - 1 + j)) * width;
      let rowSum = 0;

      for (let k = 0; k < 4; k += 1) {
        const i = row + Math.min(width - 1, Math.max(0, x0 - 1 + k));

        if (!ok(i)) {
          all = false;
          break;
        }

        rowSum += wx[k] * depth[i];
      }

      sum += wy[j] * rowSum;
    }

    if (all) return sum;

    let acc = 0;
    let wsum = 0;

    for (let j = 0; j < 2; j += 1) {
      const row = Math.min(height - 1, Math.max(0, y0 + j)) * width;

      for (let k = 0; k < 2; k += 1) {
        const i = row + Math.min(width - 1, Math.max(0, x0 + k));

        if (!ok(i)) continue;

        const weight = (k ? tx : 1 - tx) * (j ? ty : 1 - ty);

        acc += weight * depth[i];
        wsum += weight;
      }
    }

    return wsum > 1e-9 ? acc / wsum : Number.NaN;
  };
};

const N8 = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
] as const;

/**
 * Sliding-window maximum along every row (`horizontal`) or column, window `[k − w, k + w]`.
 * Pixels that do not count hold -Infinity.
 */
const maxFilter = (src: Float32Array, dst: Float32Array, w: number, fw: number, fh: number, horizontal: boolean) => {
  const len = horizontal ? fw : fh;
  const lines = horizontal ? fh : fw;
  const at = (line: number, k: number) => (horizontal ? line * fw + k : k * fw + line);
  const deque = new Int32Array(len);

  for (let line = 0; line < lines; line += 1) {
    let head = 0;
    let tail = 0;

    for (let k = 0; k < len + w; k += 1) {
      if (k < len) {
        const value = src[at(line, k)];

        while (tail > head && src[at(line, deque[tail - 1])] <= value) tail -= 1;

        deque[tail++] = k;
      }

      const out = k - w;

      if (out < 0) continue;

      while (deque[head] < out - w) head += 1;

      dst[at(line, out)] = src[at(line, deque[head])];
    }
  }
};

/** Sliding-window sum along every row or column, window `[k − w, k + w]`, in place. */
const sumFilter = (src: Float32Array, w: number, fw: number, fh: number, horizontal: boolean) => {
  const len = horizontal ? fw : fh;
  const lines = horizontal ? fh : fw;
  const at = (line: number, k: number) => (horizontal ? line * fw + k : k * fw + line);
  const prefix = new Float64Array(len + 1);

  for (let line = 0; line < lines; line += 1) {
    for (let k = 0; k < len; k += 1) prefix[k + 1] = prefix[k] + src[at(line, k)];

    for (let k = 0; k < len; k += 1) {
      src[at(line, k)] = prefix[Math.min(len, k + w + 1)] - prefix[Math.max(0, k - w)];
    }
  }
};

/**
 * Clean the depth along the cut-out, where single-image depth models smear the subject into the
 * background. Every step except the fringe, the levelling and the roll-off works within EDGE_BAND
 * pixels of the cut-out only, so ramps inside the subject stay ramps:
 *   1. isolated outliers → median of their neighbours
 *   2. occlusion ramps: where the depth drops steeply and the colours on the two sides differ, each
 *      ramp pixel takes the depth of the side its colour matches
 *   3. fringe: within EDGE_FRINGE pixels of the cut-out the surface may not sink faster than
 *      EDGE_STEEP toward it
 *   4. small islands cut off by depth jumps are shifted onto their surroundings
 *   5. levelling: within EDGE_LEVEL_RATIO × width of the cut-out, each pixel is held to the level
 *      its surroundings reach (their windowed nearest, smoothed). A pixel far behind it, near the far
 *      end of the depth, is background the cut-out kept and is removed; one behind it is lifted to
 *      it, fully at the cut-out and not at all at the rim's inner edge, so the rim is level in depth
 *      and joins the inside without a step
 *   6. optional roll-off: within `roundMm` of the cut-out the surface bends back on a quarter circle
 * Transparent pixels of the photo become invalid. A photo without transparency has no cut-out, and
 * nothing changes but that.
 */
export const cleanDepthEdges = (
  source: DepthSource,
  stats: DepthStats,
  pixels: RasterData,
  { depthMm, roundMm, widthMm }: { depthMm: number; roundMm: number; widthMm: number },
): DepthField => {
  const { depth: data, height: fh, mask, width: fw } = source;
  const W = pixels.width;
  const H = pixels.height;
  const n = fw * fh;
  const range = stats.upper - stats.lower;
  const pxMm = widthMm / fw;
  const toZ = (d: number) => (1 - (d - stats.lower) / range) * depthMm;
  const fromZ = (zz: number) => stats.lower + (1 - zz / depthMm) * range;

  const z = new Float32Array(n);
  const valid = new Uint8Array(n);
  const cut = new Uint8Array(n);
  const rgb = new Float32Array(n * 3);
  let validCount = 0;

  for (let i = 0; i < n; i += 1) {
    const x = i % fw;
    const y = (i - x) / fw;
    const o =
      (Math.min(H - 1, Math.floor(((y + 0.5) / fh) * H)) * W + Math.min(W - 1, Math.floor(((x + 0.5) / fw) * W))) * 4;

    rgb[i * 3] = pixels.data[o];
    rgb[i * 3 + 1] = pixels.data[o + 1];
    rgb[i * 3 + 2] = pixels.data[o + 2];
    cut[i] = pixels.data[o + 3] < 128 ? 1 : 0;

    if (!cut[i] && Number.isFinite(data[i]) && mask[i] > 0) {
      valid[i] = 1;
      z[i] = toZ(data[i]);
      validCount += 1;
    }
  }

  // distance (px) to the transparent cut-out; chamfer 1 / √2, the image border does not count
  const dist = new Float32Array(n).fill(Infinity);

  for (let i = 0; i < n; i += 1) if (cut[i]) dist[i] = 0;

  const relax = (i: number, j: number, w: number) => {
    if (dist[j] + w < dist[i]) dist[i] = dist[j] + w;
  };

  for (let y = 0; y < fh; y += 1) {
    for (let x = 0; x < fw; x += 1) {
      const i = y * fw + x;

      if (x > 0) relax(i, i - 1, 1);

      if (y > 0) {
        relax(i, i - fw, 1);

        if (x > 0) relax(i, i - fw - 1, Math.SQRT2);

        if (x < fw - 1) relax(i, i - fw + 1, Math.SQRT2);
      }
    }
  }

  for (let y = fh - 1; y >= 0; y -= 1) {
    for (let x = fw - 1; x >= 0; x -= 1) {
      const i = y * fw + x;

      if (x < fw - 1) relax(i, i + 1, 1);

      if (y < fh - 1) {
        relax(i, i + fw, 1);

        if (x < fw - 1) relax(i, i + fw + 1, Math.SQRT2);

        if (x > 0) relax(i, i + fw - 1, Math.SQRT2);
      }
    }
  }

  const inScope = (i: number) => dist[i] <= EDGE_BAND;

  // 1. isolated outliers: fewer than two neighbours within the steep slope
  const tolPx = EDGE_STEEP * pxMm;
  const z1 = Float32Array.from(z);
  const near: number[] = [];

  for (let i = 0; i < n; i += 1) {
    if (!valid[i] || !inScope(i)) continue;

    const x = i % fw;
    const y = (i - x) / fw;
    let agree = 0;

    near.length = 0;

    for (const [dx, dy] of N8) {
      const xx = x + dx;
      const yy = y + dy;

      if (xx < 0 || yy < 0 || xx >= fw || yy >= fh) continue;

      const j = yy * fw + xx;

      if (!valid[j]) continue;

      near.push(z[j]);

      if (Math.abs(z[j] - z[i]) <= tolPx * Math.hypot(dx, dy)) agree += 1;
    }

    if (near.length >= 3 && agree < 2) {
      near.sort((a, b) => a - b);
      z1[i] = near[near.length >> 1];
    }
  }

  // slope (mm/mm) and its uphill direction in grid coordinates
  const gx = new Float32Array(n);
  const gy = new Float32Array(n);
  const slope = new Float32Array(n);
  const diff = (i: number, j: number, k: number) => {
    if (valid[j] && valid[k]) return (z1[k] - z1[j]) / 2;

    if (valid[k]) return z1[k] - z1[i];

    return valid[j] ? z1[i] - z1[j] : 0;
  };

  for (let i = 0; i < n; i += 1) {
    if (!valid[i]) continue;

    const x = i % fw;
    const y = (i - x) / fw;
    const a = diff(i, x > 0 ? i - 1 : i, x < fw - 1 ? i + 1 : i) / pxMm;
    const b = diff(i, y > 0 ? i - fw : i, y < fh - 1 ? i + fw : i) / pxMm;

    gx[i] = a;
    gy[i] = b;
    slope[i] = Math.hypot(a, b);
  }

  // 2. occlusion ramps → one-sided fill by colour
  const z2 = Float32Array.from(z1);
  const findSide = (x: number, y: number, ux: number, uy: number) => {
    for (let s = 1; s <= EDGE_REACH; s += 1) {
      const xx = Math.round(x + ux * s);
      const yy = Math.round(y + uy * s);

      if (xx < 0 || yy < 0 || xx >= fw || yy >= fh) return -1;

      const j = yy * fw + xx;

      if (!valid[j]) return -1;

      if (slope[j] < EDGE_STEEP) return j;
    }

    return -1;
  };
  const colorDist = (i: number, j: number) =>
    Math.hypot(rgb[i * 3] - rgb[j * 3], rgb[i * 3 + 1] - rgb[j * 3 + 1], rgb[i * 3 + 2] - rgb[j * 3 + 2]);

  for (let i = 0; i < n; i += 1) {
    if (!valid[i] || slope[i] < EDGE_STEEP || !inScope(i)) continue;

    const x = i % fw;
    const y = (i - x) / fw;
    const up = findSide(x, y, gx[i] / slope[i], gy[i] / slope[i]);
    const down = findSide(x, y, -gx[i] / slope[i], -gy[i] / slope[i]);

    if (up < 0 || down < 0) continue;

    if (z1[up] - z1[down] < 2 * tolPx || colorDist(up, down) < EDGE_COLOR_MIN) continue;

    const du = colorDist(i, up);
    const dd = colorDist(i, down);

    if (du < EDGE_COLOR_RATIO * dd) z2[i] = z1[up];
    else if (dd < EDGE_COLOR_RATIO * du) z2[i] = z1[down];
  }

  // 3. cut-out fringe: limit the slope toward the edge, working inward → outward
  const band: number[] = [];

  for (let i = 0; i < n; i += 1) if (valid[i] && dist[i] <= EDGE_FRINGE) band.push(i);

  band.sort((a, b) => dist[b] - dist[a]);

  for (const i of band) {
    const x = i % fw;
    const y = (i - x) / fw;
    let sum = 0;
    let count = 0;

    for (const [dx, dy] of N8) {
      const xx = x + dx;
      const yy = y + dy;

      if (xx < 0 || yy < 0 || xx >= fw || yy >= fh) continue;

      const j = yy * fw + xx;

      if (!valid[j] || dist[j] <= dist[i] + 0.25) continue;

      sum += z2[j] - tolPx * Math.hypot(dx, dy);
      count += 1;
    }

    if (count && sum / count > z2[i] + 1e-6) z2[i] = sum / count;
  }

  // 4. small islands (4-connected without a jump) shifted onto their surroundings
  const comp = new Int32Array(n).fill(-1);
  const sizes: number[] = [];
  const queue = new Int32Array(n);
  const N4 = [-1, 1, -fw, fw];
  const linked = (i: number, j: number) => Math.abs(z2[i] - z2[j]) <= 1.5 * tolPx;
  const neighbour4 = (i: number, k: number) => {
    const x = i % fw;

    if ((k === 0 && x === 0) || (k === 1 && x === fw - 1)) return -1;

    const j = i + N4[k];

    return j < 0 || j >= n ? -1 : j;
  };

  for (let s = 0; s < n; s += 1) {
    if (!valid[s] || comp[s] >= 0) continue;

    const id = sizes.length;
    let head = 0;
    let tail = 0;

    queue[tail++] = s;
    comp[s] = id;

    while (head < tail) {
      const i = queue[head++];

      for (let k = 0; k < 4; k += 1) {
        const j = neighbour4(i, k);

        if (j < 0 || !valid[j] || comp[j] >= 0 || !linked(i, j)) continue;

        comp[j] = id;
        queue[tail++] = j;
      }
    }

    sizes.push(tail);
  }

  const minIsland = Math.max(20, EDGE_ISLAND * validCount);
  const shift = new Float64Array(sizes.length);
  const shiftN = new Int32Array(sizes.length);
  const touches = new Uint8Array(sizes.length);

  for (let i = 0; i < n; i += 1) if (comp[i] >= 0 && inScope(i)) touches[comp[i]] = 1;

  for (let i = 0; i < n; i += 1) {
    const c = comp[i];

    if (c < 0 || sizes[c] >= minIsland || !touches[c]) continue;

    for (let k = 0; k < 4; k += 1) {
      const j = neighbour4(i, k);

      if (j < 0 || comp[j] < 0 || sizes[comp[j]] < minIsland) continue;

      shift[c] += z2[j] - z2[i];
      shiftN[c] += 1;
    }
  }

  for (let i = 0; i < n; i += 1) if (comp[i] >= 0 && shiftN[comp[i]]) z2[i] += shift[comp[i]] / shiftN[comp[i]];

  // 5. levelling of the rim
  const rimPx = EDGE_LEVEL_RATIO * fw;

  if (rimPx >= 1 && validCount) {
    // a 3 × 3 mean first, so one spiked pixel cannot set the level of a whole stretch of rim
    const smooth = new Float32Array(n).fill(-Infinity);

    for (let i = 0; i < n; i += 1) {
      if (!valid[i]) continue;

      const x = i % fw;
      const y = (i - x) / fw;
      let sum = z2[i];
      let count = 1;

      for (const [dx, dy] of N8) {
        const xx = x + dx;
        const yy = y + dy;

        if (xx < 0 || yy < 0 || xx >= fw || yy >= fh) continue;

        const j = yy * fw + xx;

        if (!valid[j]) continue;

        sum += z2[j];
        count += 1;
      }

      smooth[i] = sum / count;
    }

    // the nearest level within reach, then its mean over the rim's width so the level has no steps
    const reach = Math.round(EDGE_LEVEL_REACH * rimPx);
    const level = new Float32Array(n);
    const count = new Float32Array(n);

    maxFilter(smooth, level, reach, fw, fh, true);
    maxFilter(level, smooth, reach, fw, fh, false);

    for (let i = 0; i < n; i += 1) {
      const counts = valid[i] && Number.isFinite(smooth[i]);

      level[i] = counts ? smooth[i] : 0;
      count[i] = counts ? 1 : 0;
    }

    const span = Math.round(rimPx);

    sumFilter(level, span, fw, fh, true);
    sumFilter(level, span, fw, fh, false);
    sumFilter(count, span, fw, fh, true);
    sumFilter(count, span, fw, fh, false);

    for (let i = 0; i < n; i += 1) {
      if (!valid[i] || !count[i] || dist[i] > rimPx + 1) continue;

      const behind = level[i] / count[i] - z2[i];

      if (behind <= 0) continue;

      if (behind > EDGE_LEVEL_REMOVE * depthMm && z2[i] < EDGE_LEVEL_FAR * depthMm) {
        valid[i] = 0;
        validCount -= 1;
        continue;
      }

      // the pixel on the cut-out is levelled in full; the lift fades out across the rim
      z2[i] += behind * Math.min(1, Math.max(0, 1 - (dist[i] - 1) / rimPx));
    }
  }

  // 6. roll-off: quarter circle of radius R (mm) at the cut-out edge
  if (roundMm > 0) {
    const rPx = roundMm / pxMm;

    for (let i = 0; i < n; i += 1) {
      if (!valid[i] || dist[i] - 0.5 >= rPx) continue;

      // stop short of vertical so the dither treats the rim as surface, not a jump
      const t = Math.min(EDGE_ROUND_T, 1 - Math.max(0, dist[i] - 0.5) / rPx);

      z2[i] -= roundMm * (1 - Math.sqrt(1 - t * t));
    }
  }

  // transparent pixels become invalid, so edge samples no longer reach for the background's depth
  const out = Float32Array.from(data);
  const outMask = new Uint8Array(n);

  for (let i = 0; i < n; i += 1) {
    if (!valid[i]) continue;

    out[i] = fromZ(z2[i]);
    outMask[i] = 1;
  }

  return { depth: out, height: fh, mask: outMask, width: fw };
};

/** Deterministic 0–1 hash, so the same input always gives the same extra dots. */
const hash01 = (a: number, b: number): number => {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be59b, 0xc2b2ae35);

  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;

  return (h >>> 0) / 4294967296;
};

/**
 * Lift every dither dot onto the depth, plus extra dots on steep cells (area factor − 1), so the dot
 * density follows the real surface area and steep sides are not sparse. A cell steeper than
 * EDGE_MAX_AREA spans a depth jump and gets no extra dots. Extra dots only follow the dither's own dots,
 * so dark areas stay sparse on steep sides too.
 * @returns XYZ in world millimetres: X and Y centred on the photo (Y up the image), Z from 0 (far) to
 * `depthMm` (near)
 */
export const liftDots = (
  field: DepthField,
  stats: DepthStats,
  dither: Dither,
  { depthMm, heightMm, widthMm }: { depthMm: number; heightMm: number; widthMm: number },
): Float32Array => {
  const { dots, height: h, width: w } = dither;
  const range = stats.upper - stats.lower;
  const sample = makeDepthSampler(field);
  const mmW = widthMm / w;
  const mmH = heightMm / h;
  const depthAt = (x: number, y: number) =>
    sample(((x + 0.5) / w) * field.width - 0.5, ((y + 0.5) / h) * field.height - 0.5);
  const toZ = (d: number) => (1 - Math.min(1, Math.max(0, (d - stats.lower) / range))) * depthMm;
  // grown by doubling: the count is only known at the end, and a plain array of millions of numbers
  // is many times slower
  let points = new Float32Array(Math.max(3, dither.dots.length * 3));
  let length = 0;
  const push = (x: number, y: number, zz: number) => {
    if (length + 3 > points.length) {
      const grown = new Float32Array(points.length * 2);

      grown.set(points);
      points = grown;
    }

    points[length] = ((x + 0.5) / w - 0.5) * widthMm;
    points[length + 1] = (0.5 - (y + 0.5) / h) * heightMm;
    points[length + 2] = zz;
    length += 3;
  };

  for (let i = 0; i < w * h; i += 1) {
    if (!dots[i]) continue;

    const x = i % w;
    const y = (i - x) / w;
    const d = depthAt(x, y);

    // a dot the depth does not reach (masked out by the depth model) stays on the far plane
    push(x, y, Number.isFinite(d) ? toZ(d) : 0);

    const dl = depthAt(x - 0.5, y);
    const dr = depthAt(x + 0.5, y);
    const du = depthAt(x, y - 0.5);
    const dd = depthAt(x, y + 0.5);

    if (!(Number.isFinite(dl) && Number.isFinite(dr) && Number.isFinite(du) && Number.isFinite(dd))) continue;

    const sx = (toZ(dr) - toZ(dl)) / mmW;
    const sy = (toZ(dd) - toZ(du)) / mmH;
    const area = Math.sqrt(1 + sx * sx + sy * sy);

    if (area > EDGE_MAX_AREA) continue;

    const more = Math.min(EDGE_MAX_EXTRA, area - 1);
    const count = Math.floor(more) + (hash01(i, 1) < more - Math.floor(more) ? 1 : 0);

    for (let k = 0; k < count; k += 1) {
      const jx = x + hash01(i, 2 + 2 * k) - 0.5;
      const jy = y + hash01(i, 3 + 2 * k) - 0.5;
      const dj = depthAt(jx, jy);

      if (Number.isFinite(dj)) push(jx, jy, toZ(dj));
    }
  }

  return points.slice(0, length);
};
