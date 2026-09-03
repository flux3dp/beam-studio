// tmpParseGcode.js is untransformed ESM; decodePixelRuns never touches it.
jest.mock('./tmpParseGcode', () => ({ ParsedGcode: class {} }));

import { decodePixelRuns } from './parseFcode';

describe('decodePixelRuns', () => {
  test('splits on laser off and on power changes, keeping each run power', () => {
    expect(decodePixelRuns([0, 255, 255, 128, 128, 0, 16])).toEqual([
      [1, 3, 255],
      [3, 5, 128],
      [6, 7, 16],
    ]);
  });

  test('returns no runs for a blank line', () => {
    expect(decodePixelRuns([0, 0, 0])).toEqual([]);
  });
});
