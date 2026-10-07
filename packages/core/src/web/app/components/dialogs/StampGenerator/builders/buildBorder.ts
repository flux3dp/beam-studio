import paper from 'paper';

import { collectPathItems } from '@core/helpers/generator/collectPathItems';

import { BORDER_STYLES } from '../templates/borders';
import type { BorderStyle } from '../templates/borders';
import type { BorderDef, BorderOptionValues, BorderShape, Bounds } from '../types';

import { importStyle, layoutSlices, NATIVE, sliceStyle } from './sliceBorder';

/** Sample step along the centerline when tracing a dash outline, in design px. */
const DASH_STEP = 0.5;

export const inset = ({ height, width, x, y }: Bounds, d: number): Bounds => ({
  height: height - 2 * d,
  width: width - 2 * d,
  x: x + d,
  y: y + d,
});

/**
 * Rounded rectangle path (not inserted). The radius is floored just above 0 so every rect has the
 * same 8-curve structure (4 sides + 4 arcs), which lets concentric rects map point-for-point.
 */
export const roundedRect = (bounds: Bounds, radius = 0): paper.Path =>
  new paper.Path.Rectangle({
    insert: false,
    point: [bounds.x, bounds.y],
    radius: Math.max(0.01, Math.min(radius, bounds.width / 2, bounds.height / 2)),
    size: [bounds.width, bounds.height],
  });

export const isRound = (shape: BorderShape = 'rect'): boolean => shape === 'circle' || shape === 'oval';

/**
 * The ring path of a border family at `bounds`: an ellipse for the round families, else a rounded
 * rect. Concentric rings of one family share their curve structure (4 arcs / 4 sides + 4 arcs), which
 * `strokeSegment` relies on.
 */
export const ringPath = (bounds: Bounds, radius = 0, shape: BorderShape = 'rect'): paper.Path =>
  isRound(shape)
    ? new paper.Path.Ellipse({
        insert: false,
        rectangle: new paper.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height),
      })
    : roundedRect(bounds, radius);

/**
 * Dash layout along a closed centerline of `length` design px drawn `lineWidth` wide: the
 * [start, end] offset of every dash, within [0, length]. The pattern must close on itself, so the
 * dash count is an integer and the gaps all come out equal.
 */
export const dashRanges = (length: number, lineWidth: number): Array<[number, number]> => {
  // Dash 2× and gap 1× the line width (the prototype's 6 on / 5 off at width 3 reads about like this);
  // the count is rounded so the pattern closes, then the period is stretched to fit exactly.
  const count = Math.max(1, Math.round(length / (3 * lineWidth)));
  const period = length / count;
  const dash = (period * 2) / 3;
  // Half a gap in: with an even count this centers a dash on each straight side instead of
  // putting a dash boundary at the start corner.
  const offset = (period - dash) / 2;

  return Array.from({ length: count }, (_, i) => [offset + i * period, offset + i * period + dash]);
};

interface Rings {
  center: paper.Path;
  inner: paper.Path;
  outer: paper.Path;
}

/**
 * Filled outline of the centerline segment [s0, s1] with butt caps. Each centerline sample is mapped
 * onto the same curve of the outer and inner rects: arcs by angle, straights by distance from the
 * side's midpoint so dash edges stay perpendicular. When the line is wider than the corner radius the
 * inner side is shorter than the centerline's; samples past its end clamp to the inner corner, which
 * is the mitre a real stroke would have there (a plain normal offset would fold over instead).
 */
const strokeSegment = ({ center, inner, outer }: Rings, s0: number, s1: number): paper.Path => {
  const n = Math.max(2, Math.ceil((s1 - s0) / DASH_STEP));
  const locations = Array.from({ length: n + 1 }, (_, i) =>
    center.getLocationAt((s0 + ((s1 - s0) * i) / n) % center.length),
  );
  const on = (path: paper.Path) =>
    locations.map((loc) => {
      const curve = path.curves[loc.index];

      if (!loc.curve.isStraight()) return curve.getPointAtTime(loc.time);

      const offset = loc.curveOffset + (curve.length - loc.curve.length) / 2;

      return curve.getPointAt(Math.min(Math.max(offset, 0), curve.length));
    });

  return new paper.Path({ closed: true, insert: false, segments: [...on(outer), ...on(inner).reverse()] });
};

const inkCache = new Map<BorderStyle, paper.Path[]>();

/** Flattening tolerance for frame measurements, in stamp mm: results are exact to within this. Far below the kerf. */
const FLATNESS_MM = 0.02;

/** Flattening the 6000-curve florals costs ~50 ms and every text keystroke rebuilds, so measurements are memoized. */
const measureCache = new Map<string, number>();
const measured = (key: string, measure: () => number): number => {
  if (!measureCache.has(key)) measureCache.set(key, measure());

  return measureCache.get(key)!;
};
const boundsKey = ({ height, width, x, y }: Bounds) => `${x},${y},${width},${height}`;

/** Vertices of `item` flattened to within `flatness` px, so an extremum over them is exact to that tolerance. */
const flatVertices = (item: paper.PathItem, flatness: number): paper.Point[] => {
  const flat = item.clone({ insert: false });

  flat.flatten(flatness);

  return collectPathItems(flat).flatMap((p) =>
    (p instanceof paper.CompoundPath ? (p.children as paper.Path[]) : [p as paper.Path]).flatMap((c) =>
      c.segments.map((seg) => seg.point),
    ),
  );
};

/** The design canvas of a style SVG (`viewBox="0 0 w h"`), which the designers drew as the stamp box. */
const canvasOf = (svg: string): [number, number] => {
  const [, w, h] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)!;

  return [Number(w), Number(h)];
};

/**
 * A square / circle / oval style placed onto the box as drawn: the design canvas is scaled uniformly
 * onto the box and centered, so ornaments shrink with the stamp and keep their drawn margins. The ink
 * itself isn't fitted — asymmetric ornaments make it off-square. An oval box off the drawn 3:2 ratio
 * gets a small gap between frame and cut on its long axis rather than a stretched frame.
 */
const fitStyleBorder = (bounds: Bounds, style: BorderStyle, pxPerMm: number, shape?: BorderShape): paper.PathItem => {
  if (!inkCache.has(style)) inkCache.set(style, importStyle(style));

  const item = new paper.CompoundPath({
    children: inkCache.get(style)!.map((c) => c.clone({ insert: false })),
    insert: true,
  });
  const [w, h] = canvasOf(style.svg);
  const scale = Math.min(bounds.width / w, bounds.height / h);
  const center = new paper.Point(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);

  item.scale(scale, new paper.Point(0, 0));
  item.translate(
    new paper.Point(bounds.x + (bounds.width - w * scale) / 2, bounds.y + (bounds.height - h * scale) / 2),
  );

  // Round designs are drawn to a square canvas, so corner ornaments (the vintage frames) reach past
  // the ellipse cut at 45°. Shrink until the farthest ink point (in the ellipse metric) lies on it.
  if (isRound(shape)) {
    const [a, b] = [bounds.width / 2, bounds.height / 2];
    const reach = measured(`fit:${shape}/${style.key}@${boundsKey(bounds)}/${pxPerMm}`, () =>
      flatVertices(item, FLATNESS_MM * pxPerMm).reduce(
        (max, p) => Math.max(max, Math.hypot((p.x - center.x) / a, (p.y - center.y) / b)),
        0,
      ),
    );

    if (reach > 1) item.scale(1 / reach, center);
  }

  item.fillColor = new paper.Color('black');
  item.reorient(false, true);

  return item;
};

/** Corner cells never take more than this share of a side, so small or narrow stamps keep an edge run. */
const MAX_CORNER_SHARE = 0.4;

/**
 * A decorative style nine-sliced into the box as one compound path. The scale is the stamp's physical
 * scale, capped by MAX_CORNER_SHARE. A portrait box is laid out landscape and turned 90°, so the
 * designs' long-side motifs run along the long sides.
 */
const buildStyleBorder = (bounds: Bounds, style: BorderStyle, pxPerMm: number, shape?: BorderShape): paper.PathItem => {
  if (!style.slice) return fitStyleBorder(bounds, style, pxPerMm, shape);

  const [cx, cy] = style.slice.corner;
  const center = new paper.Point(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  const portrait = bounds.height > bounds.width;
  const box = portrait
    ? { height: bounds.width, width: bounds.height, x: center.x - bounds.height / 2, y: center.y - bounds.width / 2 }
    : bounds;
  const scale = Math.min(
    pxPerMm / NATIVE.pxPerMm,
    (MAX_CORNER_SHARE * box.width) / cx,
    (MAX_CORNER_SHARE * box.height) / cy,
  );
  const item = new paper.CompoundPath({
    children: layoutSlices(sliceStyle(style), style.slice.corner, box, scale),
    insert: true,
  });

  if (portrait) item.rotate(90, center);

  item.fillColor = new paper.Color('black');
  item.reorient(false, true);

  return item;
};

/**
 * Gauge of a rounded rect centered at the origin (half size hw×hh, corner radius r): the scale at which
 * its boundary passes through (u, v), u, v ≥ 0. Side spans scale with the shape, so the side test is
 * scale-free; a corner point solves |(u, v) − s·(cw, ch)| = s·r, taking the root that leaves the point
 * outside the scaled core (the smaller one, in the cancellation-free form).
 */
const roundedRectGauge = (u: number, v: number, hw: number, hh: number, r: number): number => {
  const [cw, ch] = [hw - r, hh - r];

  if (v * hw <= u * ch) return u / hw;

  if (u * hh <= v * cw) return v / hh;

  const a = cw * cw + ch * ch - r * r;
  const b = -(u * cw + v * ch);
  const c = u * u + v * v;

  return c / (-b + Math.sqrt(b * b - a * c));
};

/**
 * How much the design content must shrink to sit inside a decorative frame's hole. The template was
 * laid out against the stroke ring's inner edge; for every (flattened) frame vertex the gauge gives the
 * scale at which that ring would pass through it, and the smallest gauge (≤ 1) is the content scale.
 * Whole-design scaling keeps inner rings, arc text and elements in proportion.
 */
export const holeScale = (frame: paper.PathItem, border: BorderDef, styleKey: string, pxPerMm: number): number =>
  measured(
    `hole:${border.shape}/${styleKey}@${boundsKey(border.bounds)}/${border.lineWidth}/${border.radius}/${pxPerMm}`,
    () => measureHole(frame, border, pxPerMm),
  );

const measureHole = (frame: paper.PathItem, border: BorderDef, pxPerMm: number): number => {
  const { bounds, lineWidth = 2, radius = 0, shape } = border;
  const [hw, hh] = [bounds.width / 2 - lineWidth, bounds.height / 2 - lineWidth];
  // Same clamp as roundedRect, so the gauge is the ring buildBorder draws.
  const r = Math.max(0.01, Math.min(radius - lineWidth, hw, hh));
  const center = new paper.Point(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  const gauge = isRound(shape)
    ? (u: number, v: number) => Math.hypot(u / hw, v / hh)
    : (u: number, v: number) => roundedRectGauge(u, v, hw, hh, r);

  return flatVertices(frame, FLATNESS_MM * pxPerMm).reduce(
    (min, p) => Math.min(min, gauge(Math.abs(p.x - center.x), Math.abs(p.y - center.y))),
    1,
  );
};

/**
 * Runtime-built frame inside `border.bounds`, whose outer edge is the box (and the cut): a stroke ring
 * growing inward (dashed = a compound of separate dash outlines) or a decorative style sliced into the
 * box. `pxPerMm` (design px per stamp mm) keeps style ornaments at the size the design drew them.
 */
export const buildBorder = (border: BorderDef, values: BorderOptionValues, pxPerMm: number): paper.PathItem => {
  const { bounds, radius = 0, shape } = border;
  const style = BORDER_STYLES[shape ?? 'rect'].find((s) => s.key === values.style);

  if (style) return buildStyleBorder(bounds, style, pxPerMm, shape);

  const w = values.lineWidth;
  const outer = ringPath(bounds, radius, shape);
  const inner = ringPath(inset(bounds, w), radius - w, shape);
  let item: paper.CompoundPath;

  if (values.dashed) {
    const rings = { center: ringPath(inset(bounds, w / 2), radius - w / 2, shape), inner, outer };
    const dashes = dashRanges(rings.center.length, w).map(([s0, s1]) => strokeSegment(rings, s0, s1));

    item = new paper.CompoundPath({ children: dashes, insert: true });
  } else {
    item = new paper.CompoundPath({ children: [outer, inner], insert: true });
    item.reorient(false, true);
  }

  item.fillColor = new paper.Color('black');

  return item;
};
