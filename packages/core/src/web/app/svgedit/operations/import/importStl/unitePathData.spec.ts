import unitePathData from './unitePathData';

describe('unitePathData', () => {
  test('unites overlapping elements into one outline, transforms applied', () => {
    const result = unitePathData(
      '<g transform="scale(10)"><rect x="0" y="0" width="10" height="10"/><rect x="5" y="5" width="10" height="10"/></g>',
    );

    expect(result).not.toBeNull();
    expect(result!.bounds).toEqual({ height: 150, width: 150, x: 0, y: 0 });
    // one closed outline rather than two overlapping squares
    expect(result!.d.match(/[Mm]/g)).toHaveLength(1);
  });

  test('keeps separate elements and holes as subpaths', () => {
    const result = unitePathData(
      '<rect x="0" y="0" width="10" height="10"/><rect x="20" y="0" width="10" height="10"/>',
    );

    expect(result!.bounds).toEqual({ height: 10, width: 30, x: 0, y: 0 });
    expect(result!.d.match(/[Mm]/g)).toHaveLength(2);
  });

  test('returns null when nothing is drawn', () => {
    expect(unitePathData('<g></g>')).toBeNull();
  });
});
