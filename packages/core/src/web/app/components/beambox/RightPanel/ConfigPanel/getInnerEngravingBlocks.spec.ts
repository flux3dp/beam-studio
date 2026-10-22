import getInnerEngravingBlocks from './getInnerEngravingBlocks';

const on = { hasStlPhoto: false, isInnerEngraving: true };

describe('getInnerEngravingBlocks', () => {
  test('nothing outside inner engraving', () => {
    expect(getInnerEngravingBlocks({ stlMode: { value: 'dot' } }, { ...on, isInnerEngraving: false })).toEqual({
      dot: false,
      layerSpacing: false,
      line: false,
      solid: false,
    });
  });

  test('dot mode: dot parameters and the solid switch, spacing only when solid', () => {
    expect(getInnerEngravingBlocks({ stlMode: { value: 'dot' }, stlSolid: { value: false } }, on)).toEqual({
      dot: true,
      layerSpacing: false,
      line: false,
      solid: true,
    });
    expect(getInnerEngravingBlocks({ stlMode: { value: 'dot' }, stlSolid: { value: true } }, on).layerSpacing).toBe(
      true,
    );
  });

  test('line mode: speed and spacing, no dot parameters', () => {
    expect(getInnerEngravingBlocks({ stlMode: { value: 'line' }, stlSolid: { value: true } }, on)).toEqual({
      dot: false,
      layerSpacing: true,
      line: true,
      solid: false,
    });
  });

  test('a photo is always dotted, so its layer shows the dot parameters in line mode too', () => {
    expect(getInnerEngravingBlocks({ stlMode: { value: 'line' } }, { ...on, hasStlPhoto: true }).dot).toBe(true);
  });

  test('a selection mixing modes shows both sets', () => {
    expect(getInnerEngravingBlocks({ stlMode: { hasMultiValue: true, value: 'dot' } }, on)).toEqual({
      dot: true,
      layerSpacing: true,
      line: true,
      solid: true,
    });
  });

  test('an unread mode counts as dot, the default', () => {
    expect(getInnerEngravingBlocks({}, on)).toMatchObject({ dot: true, line: false });
  });
});
