import type { Shader } from 'three';
import { Vector3 } from 'three';

export interface LayerColorUniform {
  value: Vector3;
}

/**
 * The per-channel offset a layer colour adds to a photo, in sRGB 0–1. The same numbers 2D writes
 * into the layer's `feColorMatrix` (`updateLayerColorFilter`): black pixels take the layer colour,
 * white stays white. Read straight from the hex rather than through `Color`, which would convert
 * the value to linear.
 */
export const getLayerColorOffset = (color: string): Vector3 => {
  const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);

  if (!res) return new Vector3(0, 0, 0);

  return new Vector3(
    Number.parseInt(res[1], 16) / 255,
    Number.parseInt(res[2], 16) / 255,
    Number.parseInt(res[3], 16) / 255,
  );
};

export const createLayerColorUniform = (): LayerColorUniform => ({ value: new Vector3(0, 0, 0) });

/**
 * `onBeforeCompile` for the photo material: adds the layer colour offset to the sampled texture.
 *
 * The 2D filter works in sRGB (`color-interpolation-filters="sRGB"`), while the shader samples an
 * sRGB texture as linear, so the colour goes to sRGB, gets the offset, and comes back to linear.
 */
export const injectLayerColor = (shader: Shader, uniform: LayerColorUniform): void => {
  shader.uniforms.layerColorOffset = uniform;
  shader.fragmentShader = `uniform vec3 layerColorOffset;\n${shader.fragmentShader}`.replace(
    '#include <map_fragment>',
    `#include <map_fragment>
	vec3 layerSrgb = min( sRGBTransferOETF( vec4( diffuseColor.rgb, 1.0 ) ).rgb + layerColorOffset, vec3( 1.0 ) );
	diffuseColor.rgb = mix( pow( layerSrgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), layerSrgb * 0.0773993808, vec3( lessThanEqual( layerSrgb, vec3( 0.04045 ) ) ) );`,
  );
};
