import getInnerEngravingBlocks from './getInnerEngravingBlocks';

const on = { hasStlPhoto: false, isInnerEngraving: true };

describe('getInnerEngravingBlocks', () => {
  test('nothing outside inner engraving', () => {
    expect(getInnerEngravingBlocks({ stlMode: { value: 'dot' } }, { ...on, isInnerEngraving: false })).toEqual({
      capInterval: false,
      dot: false,
      fillCaps: false,
      layerSpacing: false,
      line: false,
      solid: false,
    });
  });

  test('dot mode: dot parameters and the solid switch, spacing only when solid', () => {
    expect(getInnerEngravingBlocks({ stlMode: { value: 'dot' }, stlSolid: { value: false } }, on)).toEqual({
      capInterval: false,
      dot: true,
      fillCaps: false,
      layerSpacing: false,
      line: false,
      solid: true,
    });
    expect(getInnerEngravingBlocks({ stlMode: { value: 'dot' }, stlSolid: { value: true } }, on).layerSpacing).toBe(
      true,
    );
  });

  test('line mode: speed, spacing and the face fill, no dot parameters', () => {
    expect(getInnerEngravingBlocks({ stlMode: { value: 'line' }, stlSolid: { value: true } }, on)).toEqual({
      capInterval: false,
      dot: false,
      fillCaps: true,
      layerSpacing: true,
      line: true,
      solid: false,
    });
  });

  test('the face fill interval shows while the face fill is on, or mixed', () => {
    const line = { stlMode: { value: 'line' as const } };

    expect(getInnerEngravingBlocks({ ...line, stlFillCaps: { value: true } }, on).capInterval).toBe(true);
    expect(
      getInnerEngravingBlocks({ ...line, stlFillCaps: { hasMultiValue: true, value: false } }, on).capInterval,
    ).toBe(true);
    // a dot layer never fills faces, whatever it still carries
    expect(getInnerEngravingBlocks({ stlFillCaps: { value: true }, stlMode: { value: 'dot' } }, on).capInterval).toBe(
      false,
    );
  });

  test('a photo is always dotted, so its layer shows the dot parameters in line mode too', () => {
    expect(getInnerEngravingBlocks({ stlMode: { value: 'line' } }, { ...on, hasStlPhoto: true }).dot).toBe(true);
  });

  test('a selection mixing modes shows both sets', () => {
    expect(getInnerEngravingBlocks({ stlMode: { hasMultiValue: true, value: 'dot' } }, on)).toEqual({
      capInterval: false,
      dot: true,
      fillCaps: true,
      layerSpacing: true,
      line: true,
      solid: true,
    });
  });

  test('an unread mode counts as dot, the default', () => {
    expect(getInnerEngravingBlocks({}, on)).toMatchObject({ dot: true, line: false });
  });
});
