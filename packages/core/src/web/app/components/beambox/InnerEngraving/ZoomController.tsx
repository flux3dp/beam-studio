import type React from 'react';
import { useEffect, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';
import type { Camera } from 'three';
import { MathUtils, Vector3 } from 'three';

import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

import { useViewStore } from './viewStore';

const zoomBlockEvents = eventEmitterFactory.createEventEmitter('zoom-block');

/** Below this the camera would be inside the model; above it, floating-point depth falls apart. */
const MIN_DISTANCE = 1;

/**
 * Screen pixels per scene unit, measured at `target`.
 *
 * A perspective camera has no single scale — things further away are smaller — so the question only
 * has an answer at one depth, and the orbit target is the one the user is looking at. That makes
 * the number comparable with the SVG canvas's zoom, which is what lets the same control drive both.
 */
const getZoomLevel = (camera: Camera, canvasHeight: number, target: Vector3): number => {
  if ('isOrthographicCamera' in camera && camera.isOrthographicCamera) {
    // drei builds the frustum in pixels, so zoom already *is* pixels per world unit
    return (camera as unknown as { zoom: number }).zoom;
  }

  const { fov } = camera as unknown as { fov: number };
  const distance = Math.max(camera.position.distanceTo(target), MIN_DISTANCE);

  return canvasHeight / (2 * distance * Math.tan(MathUtils.degToRad(fov) / 2));
};

/**
 * Publishes the camera's zoom and applies the ones asked for from outside the canvas.
 *
 * The zoom control lives in the app's chrome, outside the r3f tree, so it cannot touch the camera
 * itself — this is the bridge. Zooming a perspective camera means moving it along its view
 * direction, which is what OrbitControls' wheel does too, so the control and the wheel stay in
 * agreement rather than fighting over two different notions of zoom.
 */
const ZoomController = ({ target }: { target: [number, number, number] }): null => {
  const { camera, size } = useThree();
  const request = useViewStore((state) => state.zoomRequest);
  const published = useRef(0);

  useFrame(() => {
    const level = getZoomLevel(camera, size.height, new Vector3(...target));

    // only on a real change, and only then does the display need waking: this runs every frame
    if (Math.abs(level - published.current) < published.current * 1e-3) return;

    published.current = level;
    useViewStore.getState().setZoomLevel(level);
    zoomBlockEvents.emit('UPDATE_ZOOM_BLOCK');
  });

  useEffect(() => {
    const { zoomLevel } = request;

    if (!Number.isFinite(zoomLevel) || zoomLevel <= 0) return;

    if ('isOrthographicCamera' in camera && camera.isOrthographicCamera) {
      (camera as unknown as { zoom: number }).zoom = zoomLevel;
      camera.updateProjectionMatrix();

      return;
    }

    const { fov } = camera as unknown as { fov: number };
    const focus = new Vector3(...target);
    const distance = Math.max(size.height / (2 * zoomLevel * Math.tan(MathUtils.degToRad(fov) / 2)), MIN_DISTANCE);

    // along the current view direction, so the zoom changes how close the camera is and nothing else
    camera.position.copy(focus).addScaledVector(camera.position.clone().sub(focus).normalize(), distance);
    camera.updateProjectionMatrix();
    // `camera`/`size`/`target` deliberately absent: a resize or a preset change must not re-apply a
    // zoom the user asked for at some earlier point
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [request]);

  return null;
};

export default ZoomController;
