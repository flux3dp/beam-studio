import paper from 'paper';

import { STAMP_TEMPLATES } from '../templates';

import { invertFace, knockoutText } from './buildShape';
import { parseTemplate } from './buildTemplate';

jest.mock('./buildText', () => ({ buildTextPaths: jest.fn() }));
jest.mock('./buildElement', () => ({ buildElementPaths: jest.fn().mockResolvedValue({}) }));

const square = (side: number, center = 50) =>
  new paper.Path.Rectangle(new paper.Point(center - side / 2, center - side / 2), new paper.Size(side, side));

/** Outer square minus inner square, oriented for nonzero fill (like a parsed template ring). */
const ring = (outer: number, inner: number) => {
  const c = new paper.CompoundPath({ children: [square(outer), square(inner)], insert: false });

  c.reorient(false, true);

  return c;
};

describe('invertFace', () => {
  beforeAll(() => paper.setup(document.createElement('canvas')));

  it('fills the outline minus engraved regions, restoring counters inside glyphs', () => {
    const outline = square(100);
    const frame = ring(80, 70); // engraved band: 80² − 70² = 1500
    const glyph = ring(20, 10); // glyph with a counter: 20² − 10² = 300

    const face = invertFace(outline, [frame, glyph]);

    expect(Math.abs(face.area)).toBeCloseTo(100 * 100 - 1500 - 300, 3);
    // The engraved items were consumed into the face.
    expect(frame.parent).toBeNull();
    expect(glyph.parent).toBeNull();
  });

  it('keeps plain-path frames (rect arcs) and uses the outermost ring edge as the boundary', () => {
    const project = new paper.Project(document.createElement('canvas'));
    const parsed = parseTemplate(project, STAMP_TEMPLATES.find((t) => t.id === 'rect_company')!);
    const outer = parsed.outline as paper.CompoundPath;
    const cut = (outer.children as paper.Path[])
      .reduce((a, b) => (Math.abs(b.area) > Math.abs(a.area) ? b : a))
      .clone({ insert: false });
    const engravedArea = parsed.frames.reduce((sum, f) => sum + Math.abs(f.area), 0);

    const face = invertFace(
      cut,
      parsed.frames.map((f) => f.clone({ insert: false })),
    );

    // outline minus the ring band minus both thin arcs
    expect(Math.abs(face.area)).toBeCloseTo(Math.abs(cut.area) - engravedArea, 2);
    // ring inner edge (now the boundary) + the two arcs; the coincident outer edge was dropped
    expect((face as paper.CompoundPath).children).toHaveLength(parsed.frames.length);
  });
});

const ringPath = (outer: number, inner: number) => {
  const c = new paper.CompoundPath({
    children: [
      new paper.Path.Rectangle({ point: [0, 0], size: [outer, outer] }),
      new paper.Path.Rectangle({ point: [(outer - inner) / 2, (outer - inner) / 2], size: [inner, inner] }),
    ],
    insert: true,
  });

  c.reorient(false, true);

  return c;
};

describe('knockoutText', () => {
  it('cuts the text out of the frame that contains it', () => {
    new paper.Project(document.createElement('canvas'));

    const band = new paper.Path.Rectangle({ point: [0, 0], size: [100, 30] });
    const glyph = new paper.Path.Circle({ center: [50, 15], radius: 5 });
    const [result] = knockoutText([band], glyph)!;

    expect(Math.abs(result.area)).toBeCloseTo(3000 - Math.PI * 25, 0);
    expect(result.contains(new paper.Point(50, 15))).toBe(false);
    expect(result.contains(new paper.Point(10, 15))).toBe(true);
  });

  it('picks the smallest containing frame, not the outer ring', () => {
    new paper.Project(document.createElement('canvas'));

    const ring = ringPath(200, 190);
    const band = new paper.Path.Rectangle({ point: [10, 10], size: [180, 40] });
    const glyph = new paper.Path.Circle({ center: [100, 30], radius: 5 });
    const [outer, cut] = knockoutText([ring, band], glyph)!;

    expect(outer).toBe(ring);
    expect(cut.contains(new paper.Point(100, 30))).toBe(false);
    expect(cut.contains(new paper.Point(20, 30))).toBe(true);
  });

  it('returns null (text kept for normal engraving) when no frame holds the text', () => {
    new paper.Project(document.createElement('canvas'));

    const band = new paper.Path.Rectangle({ point: [0, 0], size: [100, 30] });
    const glyph = new paper.Path.Circle({ center: [50, 80], radius: 5 });

    expect(knockoutText([band], glyph)).toBeNull();
    expect(glyph.parent).not.toBeNull();
  });

  it('returns null for text that only a ring surrounds (its center is in the hole)', () => {
    new paper.Project(document.createElement('canvas'));

    const ring = ringPath(100, 80);
    const glyph = new paper.Path.Circle({ center: [50, 50], radius: 5 });

    expect(knockoutText([ring], glyph)).toBeNull();
  });
});
