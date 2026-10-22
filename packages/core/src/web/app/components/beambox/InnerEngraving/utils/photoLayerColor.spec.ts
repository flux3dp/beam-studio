import type { Shader } from 'three';

import { createLayerColorUniform, getLayerColorOffset, injectLayerColor } from './photoLayerColor';

describe('test photoLayerColor', () => {
  test('getLayerColorOffset reads the hex as sRGB 0–1, like the 2D colour filter', () => {
    expect(getLayerColorOffset('#ff8000').toArray()).toEqual([1, 128 / 255, 0]);
    expect(getLayerColorOffset('#000').toArray()).toEqual([0, 0, 0]);
    expect(getLayerColorOffset('invalid').toArray()).toEqual([0, 0, 0]);
  });

  test('injectLayerColor adds the offset after the texture is sampled', () => {
    const uniform = createLayerColorUniform();
    const shader = {
      fragmentShader: 'void main() {\n#include <map_fragment>\n#include <opaque_fragment>\n}',
      uniforms: {},
      vertexShader: '',
    } as unknown as Shader;

    injectLayerColor(shader, uniform);

    expect(shader.uniforms.layerColorOffset).toBe(uniform);
    expect(shader.fragmentShader.startsWith('uniform vec3 layerColorOffset;')).toBe(true);

    const mapIndex = shader.fragmentShader.indexOf('#include <map_fragment>');
    const offsetIndex = shader.fragmentShader.indexOf('+ layerColorOffset');

    expect(mapIndex).toBeGreaterThan(-1);
    expect(offsetIndex).toBeGreaterThan(mapIndex);
    expect(offsetIndex).toBeLessThan(shader.fragmentShader.indexOf('#include <opaque_fragment>'));
  });
});
