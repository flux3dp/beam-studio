jest.mock('@core/helpers/fonts/fontHelper', () => ({}));
jest.mock('@core/helpers/is-web', () => () => false);

import { getGlyphCharRanges } from './font-funcs.util';

const glyphs = (...codePointGroups: number[][]) => codePointGroups.map((codePoints) => ({ codePoints }));

describe('getGlyphCharRanges', () => {
  it('should map one glyph per character', () => {
    expect(getGlyphCharRanges(glyphs([0x627], [0x62a], [0x628]))).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
    ]);
  });

  // 'اتبلبان' in Mishafi shapes to 5 glyphs: teh+beh and lam+beh become ligatures
  it('should span every character of a ligature', () => {
    expect(getGlyphCharRanges(glyphs([0x627], [0x62a, 0x628], [0x644, 0x628], [0x627], [0x646]))).toEqual([
      [0, 0],
      [1, 2],
      [3, 4],
      [5, 5],
      [6, 6],
    ]);
  });

  it('should keep a mark glyph on the cluster it decorates', () => {
    expect(getGlyphCharRanges(glyphs([0x62a], [], [0x628]))).toEqual([
      [0, 0],
      [0, 0],
      [1, 1],
    ]);
  });

  it('should count a surrogate pair as two characters', () => {
    expect(getGlyphCharRanges(glyphs([0x1f600], [0x41]))).toEqual([
      [0, 1],
      [2, 2],
    ]);
  });
});
