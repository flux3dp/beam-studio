import paper from 'paper';

import { BORDER_STYLES } from '../templates/borders';

import { buildBorder, dashRanges, holeScale, roundedRect } from './buildBorder';
import { sliceStyle } from './sliceBorder';

const toRect = (b: { height: number; width: number; x: number; y: number }) =>
  new paper.Rectangle(b.x, b.y, b.width, b.height);

const border = { bounds: { height: 52.08, width: 139.62, x: 5.19, y: 48.96 }, radius: 3.4 };

describe('dashRanges', () => {
  it('closes the loop: equal periods, dashes inside [0, length], dash ≈ 2× line width', () => {
    const length = 300;
    const ranges = dashRanges(length, 2);
    const period = length / ranges.length;

    expect(ranges.length).toBeGreaterThan(1);
    ranges.forEach(([s0, s1], i) => {
      expect(s0).toBeGreaterThanOrEqual(0);
      expect(s1).toBeLessThanOrEqual(length);
      expect(s1 - s0).toBeCloseTo((period * 2) / 3, 6);

      if (i > 0) expect(s0 - ranges[i - 1][0]).toBeCloseTo(period, 6);
    });
    // The wrap-around gap equals every other gap.
    expect(length - ranges.at(-1)![1] + ranges[0][0]).toBeCloseTo(period / 3, 6);
  });
});

describe('buildBorder', () => {
  beforeEach(() => new paper.Project(document.createElement('canvas')));

  it('style: on the native 47×18 box the stars come back unchanged in count and size', () => {
    const item = buildBorder(
      border,
      { dashed: false, lineWidth: 2, style: 'stars' },
      139.62 / 47,
    ) as paper.CompoundPath;

    expect(item.children).toHaveLength(42);
    item.children.forEach((star) => expect(star.bounds.width).toBeCloseTo(7 * (139.62 / 47 / 4), 1));
    expect(toRect(border.bounds).contains(item.bounds)).toBe(true);
  });

  it('style: a taller 50×24 box tiles more stars at the same physical size instead of stretching them', () => {
    const passport = { bounds: { height: 65.94, width: 140, x: 5, y: 42.03 } };
    const item = buildBorder(passport, { dashed: false, lineWidth: 2, style: 'stars' }, 140 / 50) as paper.CompoundPath;

    // 4 corners + 15 per long side + 7 per short side
    expect(item.children).toHaveLength(48);
    item.children.forEach((star) => {
      expect(star.bounds.width).toBeCloseTo(7 * (140 / 50 / 4), 0);
      expect(star.bounds.height / star.bounds.width).toBeCloseTo(1, 1);
    });
    expect(toRect(passport.bounds).contains(item.bounds)).toBe(true);
  });

  it('style: a portrait box is laid out landscape and turned, and a tiny stamp caps the corner cells', () => {
    const tall = { bounds: { height: 140, width: 52.2, x: 48.9, y: 5 } };
    const floral = buildBorder(tall, { dashed: false, lineWidth: 2, style: 'floral' }, 52.2 / 18) as paper.CompoundPath;
    // The design's long straight lines run along the long (vertical) sides after the turn.
    const longest = floral.children.reduce((a, b) => (b.length > a.length ? b : a));

    expect(longest.bounds.height).toBeGreaterThan(longest.bounds.width * 10);
    expect(toRect(tall.bounds).contains(floral.bounds)).toBe(true);

    // 四分 name seal: 100 px for 12 mm would put 7.5 mm corners on a 12 mm stamp; the cap keeps them ≤ 40%.
    const seal = { bounds: { height: 100, width: 100, x: 25, y: 25 } };
    const deco = buildBorder(
      seal,
      { dashed: false, lineWidth: 2, style: 'deco_corners' },
      100 / 12,
    ) as paper.CompoundPath;
    const corner = deco.children.filter((c) => c.bounds.right < 25 + 40.5 && c.bounds.bottom < 25 + 40.5);

    expect(corner.length).toBeGreaterThan(0);
    expect(toRect(seal.bounds).contains(deco.bounds)).toBe(true);
  });

  it('style: an off-center design is centered before slicing, so the frame is symmetric in the box', () => {
    // square_corners' ink sits 0.53 px left and 0.74 px up of its viewBox center.
    const item = buildBorder(
      border,
      { dashed: false, lineWidth: 2, style: 'square_corners' },
      139.62 / 47,
    ) as paper.CompoundPath;

    expect(item.bounds.center.x).toBeCloseTo(border.bounds.x + border.bounds.width / 2, 2);
    expect(item.bounds.center.y).toBeCloseTo(border.bounds.y + border.bounds.height / 2, 2);
  });

  it('style: the far corners and repeats are mirrors of the near ones, so junctions match on hand-drawn designs', () => {
    const slices = sliceStyle(BORDER_STYLES.rect.find((s) => s.key === 'wave')!);

    slices.tl.contours.forEach((c, i) => {
      const t = slices.tr.contours[i].bounds;

      expect(t.left).toBeCloseTo(188 - c.bounds.right, 6);
      expect(t.top).toBeCloseTo(c.bounds.top, 6);
    });
    expect(slices.r.unit!.contours).toHaveLength(slices.l.unit!.contours.length);
  });

  it('style: postage keeps its hole (band pieces are plain contours, nothing fills the middle)', () => {
    const item = buildBorder(
      border,
      { dashed: false, lineWidth: 2, style: 'postage' },
      139.62 / 47,
    ) as paper.CompoundPath;
    const center = new paper.Point(75, 75);

    expect(item.contains(center)).toBe(false);
    expect(item.contains(new paper.Point(75, border.bounds.y + 2.5))).toBe(true);
  });

  it.each(['square', 'circle', 'oval'] as const)(
    '%s styles: every style sits inside its box, spans it, keeps a hole',
    (shape) => {
      const box = { bounds: { height: shape === 'oval' ? 60 : 90, width: 90, x: 30, y: 30 }, shape };
      // Design files overshoot their canvas by up to 0.4 px (oval floral_2), scaled here by 0.5.
      const rect = toRect(box.bounds).expand(0.5);

      for (const { key } of BORDER_STYLES[shape]) {
        const item = buildBorder(box, { dashed: false, lineWidth: 2, style: key }, 4) as paper.CompoundPath;
        const span = Math.max(item.bounds.width / box.bounds.width, item.bounds.height / box.bounds.height);

        // Round vintage frames shrink to ~85% so their corner ornaments clear the ellipse cut.
        expect([key, rect.contains(item.bounds), span > 0.8, item.contains(rect.center)]).toEqual([
          key,
          true,
          true,
          false,
        ]);
      }
    },
  );

  it('holeScale: a round frame shrinks the content by hole radius over ring inner radius', () => {
    const def = { bounds: { height: 140, width: 140, x: 5, y: 5 }, lineWidth: 3, shape: 'circle' as const };
    const hole = new paper.CompoundPath({
      children: [
        new paper.Path.Circle({ center: [75, 75], insert: false, radius: 70 }),
        new paper.Path.Circle({ center: [75, 75], insert: false, radius: 50 }),
      ],
      insert: false,
    });

    expect(holeScale(hole, def, 'test_round', 140 / 40)).toBeCloseTo(50 / 67, 3);
  });

  it('holeScale: on a rect ring, points on the ring itself gauge to 1 and an inward bar sets the scale', () => {
    const def = { bounds: border.bounds, lineWidth: 2, radius: 3.4 };
    const ring = buildBorder(def, { dashed: false, lineWidth: 2, style: 'stroke' }, 3) as paper.CompoundPath;
    const inner = ring.children[1] as paper.Path;
    // The inner ring's own points (sides and corner arcs) sit exactly on the gauge = 1 surface.
    const onRing = new paper.CompoundPath({ children: [inner.clone({ insert: false })], insert: false });

    expect(holeScale(onRing, def, 'test_ring', 3)).toBeCloseTo(1, 3);

    // A bar reaching 10 px down from the top edge at the center: hole half-height 24.04 − 2 − 10 over 24.04.
    const bar = new paper.Path.Rectangle({ insert: false, point: [70, 48.96], size: [10, 12] });

    expect(holeScale(bar, def, 'test_bar', 3)).toBeCloseTo((26.04 - 2 - 10) / 24.04, 3);
  });

  it('solid: a ring whose area is the outer box minus the inset box', () => {
    const ring = buildBorder(border, { dashed: false, lineWidth: 2, style: 'stroke' }, 3);
    const outer = Math.abs(roundedRect(border.bounds, 3.4).area);
    const inner = Math.abs(roundedRect({ height: 48.08, width: 135.62, x: 7.19, y: 50.96 }, 1.4).area);

    expect(ring.bounds.width).toBeCloseTo(139.62, 3);
    expect(Math.abs(ring.area)).toBeCloseTo(outer - inner, 1);
  });

  it('dashed: one closed outline per dash, all inside the box, total area close to the dash coverage', () => {
    const lineWidth = 2;
    const item = buildBorder(border, { dashed: true, lineWidth, style: 'stroke' }, 3) as paper.CompoundPath;
    const center = roundedRect({ height: 50.08, width: 137.62, x: 6.19, y: 49.96 }, 2.4);
    const ranges = dashRanges(center.length, lineWidth);
    const covered = ranges.reduce((sum, [s0, s1]) => sum + (s1 - s0) * lineWidth, 0);

    expect(item.children).toHaveLength(ranges.length);
    item.children.forEach((dash) => {
      expect((dash as paper.Path).closed).toBe(true);
      expect(dash.bounds.left).toBeGreaterThanOrEqual(border.bounds.x - 1e-6);
      expect(dash.bounds.right).toBeLessThanOrEqual(border.bounds.x + border.bounds.width + 1e-6);
    });
    expect(Math.abs(item.area)).toBeCloseTo(covered, -1);
  });
});
