import paper from 'paper';

import { fitLetterSpacing, fitToBounds, keepClear } from './buildText';

// The generator helpers pull in font-funcs, whose deps are ESM-only under Jest.
jest.mock('@core/helpers/generator/textElement', () => ({}));
jest.mock('@core/helpers/generator/textToPath', () => ({}));

describe('fitToBounds', () => {
  beforeAll(() => {
    paper.setup(document.createElement('canvas'));
  });

  it('stretches ink bounds to exactly fill the box and centers it', () => {
    const item = new paper.Path.Rectangle(new paper.Point(0, 0), new paper.Size(50, 5));

    fitToBounds(item, { height: 11, width: 60, x: 45, y: 51 });

    expect(item.bounds.x).toBeCloseTo(45, 6);
    expect(item.bounds.y).toBeCloseTo(51, 6);
    expect(item.bounds.width).toBeCloseTo(60, 6);
    expect(item.bounds.height).toBeCloseTo(11, 6);
  });

  it('leaves degenerate items alone', () => {
    const item = new paper.Path.Rectangle(new paper.Point(3, 4), new paper.Size(0, 10));

    fitToBounds(item, { height: 11, width: 60, x: 45, y: 51 });

    expect(item.bounds.x).toBe(3);
  });
});

describe('fitLetterSpacing', () => {
  it('keeps the current spacing when tighten-only and the text already fits', () => {
    expect(fitLetterSpacing(100, 120, 10, 0.5)).toBe(0.5);
  });

  it('tightens by the overflow spread across the gaps', () => {
    expect(fitLetterSpacing(130, 100, 10, 0)).toBeCloseTo(-3, 6);
    expect(fitLetterSpacing(130, 100, 10, 1)).toBeCloseTo(-2, 6);
  });

  it('expands to span the target when allowed', () => {
    expect(fitLetterSpacing(60, 90, 5, 0, false)).toBeCloseTo(6, 6);
  });

  it('is a no-op without gaps', () => {
    expect(fitLetterSpacing(130, 100, 0, 0)).toBe(0);
    expect(fitLetterSpacing(30, 100, 0, 0, false)).toBe(0);
  });
});

describe('keepClear', () => {
  const box = { height: 10, width: 100, x: 20, y: 40 };

  it('trims the side the obstacle is on and keeps the padding', () => {
    expect(keepClear(box, { height: 30, width: 30, x: 10, y: 30 }, 4)).toEqual({ ...box, width: 76, x: 44 });
    expect(keepClear(box, { height: 30, width: 30, x: 100, y: 30 }, 4)).toEqual({ ...box, width: 76 });
  });

  it('ignores obstacles that do not overlap the box vertically', () => {
    expect(keepClear(box, { height: 10, width: 30, x: 10, y: 60 }, 4)).toBe(box);
  });

  it('keeps the box when trimming would leave nothing', () => {
    expect(keepClear(box, { height: 30, width: 200, x: 0, y: 30 }, 4)).toBe(box);
  });
});
