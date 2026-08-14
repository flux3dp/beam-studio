import type { Camera, OrthographicCamera, PerspectiveCamera } from 'three';
import { MathUtils, Vector3 } from 'three';

/**
 * The two kinds of camera this canvas uses. three's base `Camera` declares neither the projection
 * terms nor `updateProjectionMatrix`, so anything reconfiguring a camera has to say which it means.
 */
export type SceneCamera = OrthographicCamera | PerspectiveCamera;

/** Below this the camera would be inside the model; above it, floating-point depth falls apart. */
export const MIN_DISTANCE = 1;

export const isOrthographic = (camera: Camera): camera is OrthographicCamera =>
  Boolean((camera as OrthographicCamera).isOrthographicCamera);

const halfFovTan = (camera: Camera): number =>
  Math.tan(MathUtils.degToRad((camera as PerspectiveCamera).fov) / 2);

/**
 * Screen pixels per scene unit, measured at `target`.
 *
 * A perspective camera has no single scale — things further away are smaller — so the question only
 * has an answer at one depth, and the orbit target is the one the user is looking at. That makes the
 * number comparable with the SVG canvas's zoom, which is what lets the same control drive both, and
 * comparable *between* the two projections, which is what lets one stand in for the other.
 */
export const getZoomLevel = (camera: Camera, canvasHeight: number, target: Vector3): number => {
  // drei builds the frustum in pixels, so zoom already *is* pixels per world unit
  if (isOrthographic(camera)) return camera.zoom;

  const distance = Math.max(camera.position.distanceTo(target), MIN_DISTANCE);

  return canvasHeight / (2 * distance * halfFovTan(camera));
};

/** How far a perspective camera has to sit from `target` to show it at `zoomLevel`. */
export const getDistanceForZoom = (camera: Camera, canvasHeight: number, zoomLevel: number): number =>
  Math.max(canvasHeight / (2 * zoomLevel * halfFovTan(camera)), MIN_DISTANCE);

/**
 * Unit vector from `target` towards the camera — the direction a zoom moves along.
 *
 * A camera sitting exactly on its target has no direction to read off its position, so this falls
 * back to where it is pointing. Without that the normalize below returns a zero vector, and every
 * caller ends up placing the camera on the target itself.
 */
export const getViewDirection = (camera: Camera, target: Vector3): Vector3 => {
  const offset = camera.position.clone().sub(target);

  return offset.lengthSq() > 0 ? offset.normalize() : camera.getWorldDirection(new Vector3()).negate();
};
