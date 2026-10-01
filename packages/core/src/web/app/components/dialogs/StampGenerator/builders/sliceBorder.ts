import paper from 'paper';

import { collectPathItems } from '@core/helpers/generator/collectPathItems';

import type { BorderStyle } from '../templates/borders';
import type { Bounds } from '../types';

/** The design team's border canvas: 188×72 px = 47×18 mm at 4 px/mm. */
export const NATIVE = { height: 72, pxPerMm: 4, width: 188 } as const;

type RegionKey = 'b' | 'bl' | 'br' | 'c' | 'l' | 'r' | 't' | 'tl' | 'tr';

const KEYS: RegionKey[] = ['tl', 't', 'tr', 'l', 'c', 'r', 'bl', 'b', 'br'];

interface Piece {
  contours: paper.Path[];
  src: Bounds;
}

interface Region extends Piece {
  /** One repeat of a tiled edge, cut from the start of the strip. */
  unit?: Piece;
}

type Slices = Record<RegionKey, Region>;

/** Nine-slice grid of a w×h box with corner cells of cx×cy. */
const regionsOf = (w: number, h: number, [cx, cy]: [number, number], x0 = 0, y0 = 0): Record<RegionKey, Bounds> => {
  const xs = [0, cx, w - cx, w];
  const ys = [0, cy, h - cy, h];
  const at = (i: number, j: number): Bounds => ({
    height: ys[j + 1] - ys[j],
    width: xs[i + 1] - xs[i],
    x: x0 + xs[i],
    y: y0 + ys[j],
  });

  return {
    b: at(1, 2),
    bl: at(0, 2),
    br: at(2, 2),
    c: at(1, 1),
    l: at(0, 1),
    r: at(2, 1),
    t: at(1, 0),
    tl: at(0, 0),
    tr: at(2, 0),
  };
};

const toRect = (b: Bounds) => new paper.Rectangle(b.x, b.y, b.width, b.height);

/** Every closed contour of an item: compound paths are split into their children. */
const contoursOf = (item: paper.Item): paper.Path[] =>
  collectPathItems(item).flatMap((p) =>
    p instanceof paper.CompoundPath ? (p.children as paper.Path[]) : [p as paper.Path],
  );

const clip = (contours: paper.Path[], bounds: Bounds): paper.Path[] => {
  if (!contours.length) return [];

  const compound = new paper.CompoundPath({ children: contours.map((c) => c.clone({ insert: false })), insert: false });

  compound.reorient(false, true);

  return contoursOf(
    compound.intersect(new paper.Path.Rectangle({ insert: false, rectangle: toRect(bounds) }), { insert: false }),
  );
};

const cache = new Map<string, Slices>();

/** Mirrored clones about the canvas center: x, y, or both. */
const mirror = (contours: paper.Path[], sx: number, sy: number): paper.Path[] =>
  contours.map((c) => {
    const copy = c.clone({ insert: false });

    copy.scale(sx, sy, new paper.Point(NATIVE.width / 2, NATIVE.height / 2));

    return copy;
  });

/**
 * Cuts a style's native ink into nine regions (once per style). A contour wholly inside one region is
 * taken as is; the rest are merged and boolean-clipped per region so band pieces come out as plain
 * filled contours (holes already subtracted). Tiled edges also get their first repeat unit.
 * The designs are symmetric by intent but not by hand (the thin wave's far corner sits a peak away
 * from its near one), so the other three corners and the bottom/right repeat units are mirrors of the
 * top-left corner and the top/left units: every tile junction then matches by construction.
 */
export const sliceStyle = (style: BorderStyle): Slices => {
  const cached = cache.get(style.key);

  if (cached) return cached;

  const { corner, tile } = style.slice;
  const regions = regionsOf(NATIVE.width, NATIVE.height, corner);
  const contours = contoursOf(paper.project.importSVG(style.svg, { expandShapes: true, insert: false }));
  // The designs aren't centered in their viewBox (margins differ by up to 1.5 px), which would give the
  // left and right corner cells different slices of the same ornament. Center the ink first; tiled
  // styles' cut positions in borders.ts are measured after this shift.
  const ink = contours.map((c) => c.bounds).reduce((a, b) => a.unite(b));

  contours.forEach((c) =>
    c.translate(new paper.Point(NATIVE.width / 2 - ink.center.x, NATIVE.height / 2 - ink.center.y)),
  );

  const inside = Object.fromEntries(KEYS.map((k) => [k, [] as paper.Path[]])) as Record<RegionKey, paper.Path[]>;
  const crossing: paper.Path[] = [];

  for (const c of contours) {
    const key = KEYS.find((k) => toRect(regions[k]).contains(c.bounds));

    if (key) inside[key].push(c);
    else crossing.push(c);
  }

  const slices = Object.fromEntries(
    KEYS.map((key) => {
      const src = regions[key];
      const region: Region = { contours: [...inside[key], ...clip(crossing, src)], src };
      const period = key === 't' || key === 'b' ? tile?.h : key === 'l' || key === 'r' ? tile?.v : undefined;

      if (period) {
        const unitSrc = key === 't' || key === 'b' ? { ...src, width: period } : { ...src, height: period };

        region.unit = { contours: clip(region.contours, unitSrc), src: unitSrc };
      }

      return [key, region];
    }),
  ) as Slices;

  slices.tr.contours = mirror(slices.tl.contours, -1, 1);
  slices.bl.contours = mirror(slices.tl.contours, 1, -1);
  slices.br.contours = mirror(slices.tl.contours, -1, -1);

  if (slices.t.unit) slices.b.unit = { contours: mirror(slices.t.unit.contours, 1, -1), src: slices.b.unit!.src };

  if (slices.l.unit) slices.r.unit = { contours: mirror(slices.l.unit.contours, -1, 1), src: slices.r.unit!.src };

  cache.set(style.key, slices);

  return slices;
};

/** Clones `piece` mapped from its source cell onto `dst` (independent x/y scale). */
const place = ({ contours, src }: Piece, dst: Bounds): paper.Path[] =>
  contours.map((c) => {
    const copy = c.clone({ insert: false });

    copy.scale(dst.width / src.width, dst.height / src.height, new paper.Point(src.x, src.y));
    copy.translate(new paper.Point(dst.x - src.x, dst.y - src.y));

    return copy;
  });

/**
 * Lays the slices out in `bounds`: corners at `scale`× their native size, the center stretched, and
 * each edge either stretched along its own axis or tiled with a whole number of units (each scaled by
 * at most half a unit so the run fits exactly).
 */
export const layoutSlices = (slices: Slices, corner: [number, number], bounds: Bounds, scale: number): paper.Path[] => {
  const dst = regionsOf(bounds.width, bounds.height, [corner[0] * scale, corner[1] * scale], bounds.x, bounds.y);

  return KEYS.flatMap((key) => {
    const region = slices[key];
    const d = dst[key];

    if (d.width <= 0 || d.height <= 0 || region.src.width <= 0 || region.src.height <= 0) return [];

    if (!region.unit) return place(region, d);

    const horizontal = key === 't' || key === 'b';
    const length = horizontal ? d.width : d.height;
    const unitLength = (horizontal ? region.unit.src.width : region.unit.src.height) * scale;
    const n = Math.max(1, Math.round(length / unitLength));
    const step = length / n;

    return Array.from({ length: n }, (_, i) =>
      place(
        region.unit!,
        horizontal ? { ...d, width: step, x: d.x + i * step } : { ...d, height: step, y: d.y + i * step },
      ),
    ).flat();
  });
};
