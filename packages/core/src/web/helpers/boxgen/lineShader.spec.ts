import * as THREE from 'three';

import ThicknessShader from './lineShader';

describe('ThicknessShader', () => {
  test('exposes vertex and fragment shader source strings', () => {
    expect(typeof ThicknessShader.vertexShader).toBe('string');
    expect(typeof ThicknessShader.fragmentShader).toBe('string');
    expect(ThicknessShader.vertexShader.length).toBeGreaterThan(0);
    expect(ThicknessShader.fragmentShader.length).toBeGreaterThan(0);
  });

  test('vertex shader declares the center attribute and vCenter varying', () => {
    expect(ThicknessShader.vertexShader).toContain('attribute vec3 center');
    expect(ThicknessShader.vertexShader).toContain('varying vec3 vCenter');
    expect(ThicknessShader.vertexShader).toContain('gl_Position');
  });

  test('fragment shader uses the thickness uniform and writes gl_FragColor', () => {
    expect(ThicknessShader.fragmentShader).toContain('uniform float thickness');
    expect(ThicknessShader.fragmentShader).toContain('gl_FragColor');
  });

  test('renders both sides using THREE.DoubleSide', () => {
    expect(ThicknessShader.side).toBe(THREE.DoubleSide);
  });

  test('defines a thickness uniform with a default value', () => {
    expect(ThicknessShader.uniforms.thickness).toBeDefined();
    expect(ThicknessShader.uniforms.thickness.value).toBeCloseTo(0.1);
  });
});
