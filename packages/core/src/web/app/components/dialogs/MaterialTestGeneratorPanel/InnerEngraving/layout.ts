import constant from '@core/app/actions/beambox/constant';

import type { BlockSetting } from '../BlockSetting';

/**
 * Pure 2D layout of the inner engraving material test, in SVG user units (0.1mm, Y down).
 *
 * Everything is laid out flat first and only extruded once the XY scaling and offset are final, so
 * the union bounding box the forced size is measured on is the exact footprint that gets engraved.
 */

const { dpmm } = constant;

export interface Box {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
}

/** A 2D affine matrix, in the order of SVG's `matrix(a b c d e f)`. */
export interface Affine {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export type Vec3 = [number, number, number];

/** Forced overall size and centre, in mm. The centre uses the 3D scene axes (Y towards the back). */
export interface ForceTransform {
  offset: Vec3;
  scale: Vec3;
}

export const IDENTITY: Affine = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

export const multiply = (m: Affine, n: Affine): Affine => ({
  a: m.a * n.a + m.c * n.b,
  b: m.b * n.a + m.d * n.b,
  c: m.a * n.c + m.c * n.d,
  d: m.b * n.c + m.d * n.d,
  e: m.a * n.e + m.c * n.f + m.e,
  f: m.b * n.e + m.d * n.f + m.f,
});

const compose = (...matrices: Affine[]): Affine => matrices.reduce(multiply, IDENTITY);

const translate = (x: number, y: number): Affine => ({ ...IDENTITY, e: x, f: y });

const scale = (x: number, y = x): Affine => ({ ...IDENTITY, a: x, d: y });

const rotate = (deg: number): Affine => {
  const rad = (deg * Math.PI) / 180;
  const [cos, sin] = [Math.cos(rad), Math.sin(rad)];

  return { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
};

export const toSvgMatrix = ({ a, b, c, d, e, f }: Affine): string => `matrix(${a} ${b} ${c} ${d} ${e} ${f})`;

const width = (box: Box): number => box.maxX - box.minX;
const height = (box: Box): number => box.maxY - box.minY;

/** The axis-aligned bounds of `box` after `m`. */
export const transformBox = (box: Box, m: Affine): Box => {
  const xs: number[] = [];
  const ys: number[] = [];

  [
    [box.minX, box.minY],
    [box.maxX, box.minY],
    [box.minX, box.maxY],
    [box.maxX, box.maxY],
  ].forEach(([x, y]) => {
    xs.push(m.a * x + m.c * y + m.e);
    ys.push(m.b * x + m.d * y + m.f);
  });

  return { maxX: Math.max(...xs), maxY: Math.max(...ys), minX: Math.min(...xs), minY: Math.min(...ys) };
};

export const getUnionBox = (boxes: Box[]): Box | null =>
  boxes.length
    ? boxes.reduce((union, box) => ({
        maxX: Math.max(union.maxX, box.maxX),
        maxY: Math.max(union.maxY, box.maxY),
        minX: Math.min(union.minX, box.minX),
        minY: Math.min(union.minY, box.minY),
      }))
    : null;

/** Outline font sizes the labels are measured at, before the label scale. */
export const VALUE_FONT_SIZE = 48;
export const TITLE_FONT_SIZE = 130;

/** The block size the 2D generator's text sizes were designed for, in mm. */
const REFERENCE_BLOCK_SIZE = 10;
/** Share of a row / column pitch a value label may take up. */
const LABEL_FILL = 0.9;
/** Gap between the grid and its labels, and between labels and titles, at the reference size. */
const LABEL_GAP = 2 * dpmm;

/**
 * How much smaller than the 2D generator's text the labels start out.
 *
 * Inner engraving tests usually use far smaller blocks than the 10mm default, where text sized for
 * 10mm blocks dwarfs the grid. Text only ever shrinks with the blocks, never grows past the 2D size;
 * the per-label fits in {@link layoutMaterialTest} then shrink anything that still overflows.
 */
export const getLabelScale = ({ column, row }: BlockSetting): number =>
  Math.min(1, Math.min(row.size.value, column.size.value) / REFERENCE_BLOCK_SIZE);

/** Place an outline so its centre lands on (x, y), rotated and scaled about that centre. */
const place = (box: Box, x: number, y: number, factor: number, deg = 0): Affine =>
  compose(
    translate(x, y),
    rotate(deg),
    scale(factor),
    translate(-(box.minX + box.maxX) / 2, -(box.minY + box.maxY) / 2),
  );

/** The largest factor <= `limit` at which `size` fits in `space`. */
const fitFactor = (limit: number, sizes: number[], space: number): number =>
  Math.min(limit, ...sizes.filter((size) => size > 0).map((size) => space / size));

const maxOf = (values: number[]): number => (values.length ? Math.max(...values) : 0);

export interface LabelBoxes {
  colTitle: Box | null;
  /** One per column-axis block, in grid order. */
  colValues: Array<Box | null>;
  rowTitle: Box | null;
  /** One per row-axis block, in grid order. */
  rowValues: Array<Box | null>;
}

export interface MaterialTestLayout {
  /** Row-major: index `colIndex * rowCount + rowIndex`, the order of `generateSvgInfo`. */
  blocks: Box[];
  colTitle: Affine | null;
  colValues: Array<Affine | null>;
  rowTitle: Affine | null;
  rowValues: Array<Affine | null>;
}

/**
 * Lay the blocks out on their grid and place every label around it.
 *
 * Row values sit above their block column, rotated to read downwards; column values sit to the
 * left, horizontal. The titles go outside those, centred on the grid and never longer than it.
 * Label boxes are the measured outlines at their base font size, so the fits are exact.
 */
export const layoutMaterialTest = (blockSetting: BlockSetting, labels: LabelBoxes): MaterialTestLayout => {
  const { column, row } = blockSetting;
  const k = getLabelScale(blockSetting);
  const gap = LABEL_GAP * k;
  const [blockW, blockH] = [row.size.value * dpmm, column.size.value * dpmm];
  const rowPitch = (row.size.value + row.spacing.value) * dpmm;
  const colPitch = (column.size.value + column.spacing.value) * dpmm;
  const gridW = (row.count.value - 1) * rowPitch + blockW;
  const gridH = (column.count.value - 1) * colPitch + blockH;

  const blocks = Array.from({ length: column.count.value * row.count.value }, (_, index) => {
    const [x, y] = [(index % row.count.value) * rowPitch, Math.floor(index / row.count.value) * colPitch];

    return { maxX: x + blockW, maxY: y + blockH, minX: x, minY: y };
  });

  const rowValueBoxes = labels.rowValues.filter(Boolean) as Box[];
  const colValueBoxes = labels.colValues.filter(Boolean) as Box[];
  // one factor per label kind, so values in the same row or column stay the same size; rotated by
  // 90°, a row value's height is what has to fit in the row pitch
  const rowValueScale = fitFactor(k, rowValueBoxes.map(height), rowPitch * LABEL_FILL);
  const colValueScale = fitFactor(k, colValueBoxes.map(height), colPitch * LABEL_FILL);
  const rowValuesExtent = maxOf(rowValueBoxes.map(width)) * rowValueScale;
  const colValuesExtent = maxOf(colValueBoxes.map(width)) * colValueScale;

  const rowValues = labels.rowValues.map((box, index) => {
    if (!box) return null;

    // bottom-aligned just above the grid
    return place(box, index * rowPitch + blockW / 2, -gap - (width(box) * rowValueScale) / 2, rowValueScale, 90);
  });
  const colValues = labels.colValues.map((box, index) => {
    if (!box) return null;

    // right-aligned just left of the grid
    return place(box, -gap - (width(box) * colValueScale) / 2, index * colPitch + blockH / 2, colValueScale);
  });

  const rowTitle = labels.rowTitle
    ? (() => {
        const box = labels.rowTitle;
        const factor = fitFactor(k, [width(box)], gridW);

        return place(box, gridW / 2, -gap - rowValuesExtent - gap - (height(box) * factor) / 2, factor);
      })()
    : null;
  const colTitle = labels.colTitle
    ? (() => {
        const box = labels.colTitle;
        const factor = fitFactor(k, [width(box)], gridH);

        return place(box, -gap - colValuesExtent - gap - (height(box) * factor) / 2, gridH / 2, factor, -90);
      })()
    : null;

  return { blocks, colTitle, colValues, rowTitle, rowValues };
};

/**
 * The matrix that scales `union` to the forced XY size and centres it on the forced XY offset.
 *
 * Each axis scales independently. An axis with no extent keeps its size rather than turning the
 * factor into Infinity.
 */
export const getForceMatrix = (union: Box, { offset, scale: size }: ForceTransform, workareaHeight: number): Affine => {
  const [w, h] = [width(union), height(union)];
  const fx = w > 0 ? (size[0] * dpmm) / w : 1;
  const fy = h > 0 ? (size[1] * dpmm) / h : 1;

  return compose(
    // scene Y points to the back, SVG Y points down
    translate(offset[0] * dpmm, workareaHeight - offset[1] * dpmm),
    scale(fx, fy),
    translate(-(union.minX + union.maxX) / 2, -(union.minY + union.maxY) / 2),
  );
};
