import { STL_ATTR } from './constants';
import { getExtrusionSourceTagName } from './sourceType';

describe('getExtrusionSourceTagName', () => {
  test('reads the retained editable source type', () => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

    elem.setAttribute(
      STL_ATTR.source,
      JSON.stringify({ depth: 1, markup: '<text font-size="20">Flux</text>', scale: 0.1, type: 'svg' }),
    );

    expect(getExtrusionSourceTagName(elem)).toBe('text');
  });

  test('rejects missing or invalid metadata', () => {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

    expect(getExtrusionSourceTagName(elem)).toBeNull();
    elem.setAttribute(STL_ATTR.source, '{');
    expect(getExtrusionSourceTagName(elem)).toBeNull();
  });
});
