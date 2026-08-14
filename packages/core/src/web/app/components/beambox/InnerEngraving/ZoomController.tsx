import { useCallback, useEffect, useRef } from 'react';

import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';

import eventEmitterFactory from '@core/helpers/eventEmitterFactory';

import { getDistanceForZoom, getViewDirection, getZoomLevel, isOrthographic } from './utils/camera';
import { useViewStore } from './viewStore';

const zoomBlockEvents = eventEmitterFactory.createEventEmitter('zoom-block');

/** Only the parts of OrbitControls used here, to avoid depending on drei's transitive three-stdlib. */
interface OrbitLike {
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
  target: Vector3;
  update: () => void;
}

/**
 * Publishes the camera's zoom and applies the ones asked for from outside the canvas.
 *
 * The zoom control lives in the app's chrome, outside the r3f tree, so it cannot touch the camera
 * itself — this is the bridge. Zooming a perspective camera means moving it along its view
 * direction, which is what OrbitControls' wheel does too, so the control and the wheel stay in
 * agreement rather than fighting over two different notions of zoom.
 */
const ZoomController = ({ target }: { target: [number, number, number] }): null => {
  const camera = useThree((state) => state.camera);
  const height = useThree((state) => state.size.height);
  const controls = useThree((state) => state.controls) as null | OrbitLike;
  const request = useViewStore((state) => state.zoomRequest);
  const projection = useViewStore((state) => state.projection);
  const view = useViewStore((state) => state.view);
  // the request standing at mount is the store's initial placeholder, not something the user asked
  // for: applying it would throw away the framing the canvas was seeded with
  const appliedVersion = useRef(useViewStore.getState().zoomRequest.version);
  const published = useRef(0);

  // what the camera actually orbits: a pan walks the controls' target away from the preset one, and
  // measuring against the preset would then report a zoom the user is not looking at
  const getFocus = useCallback(() => controls?.target.clone() ?? new Vector3(...target), [controls, target]);

  const publish = useCallback(() => {
    const level = getZoomLevel(camera, height, getFocus());

    // only on a real change, and only then does the display need waking
    if (Math.abs(level - published.current) < published.current * 1e-3) return;

    published.current = level;
    useViewStore.getState().setZoomLevel(level);
    zoomBlockEvents.emit('UPDATE_ZOOM_BLOCK');
  }, [camera, getFocus, height]);

  // Inner engraving mode tears this canvas down and the next one opens at a preset again, so a level
  // left behind would be a stale answer to a question the next canvas has not been asked yet — and
  // the control would show it in preference to the framing it can work out for itself
  useEffect(() => () => useViewStore.getState().setZoomLevel(0), []);

  // Measuring once per frame kept the whole store churning while nothing moved. Everything that can
  // move the camera announces itself, so the measurements can hang off those announcements instead:
  // the controls' own `change` below, and here a mount, a resize, or a preset/projection ViewController
  // has just applied — its effect runs before this one, being the earlier sibling.
  useEffect(publish, [publish, projection, view]);

  useEffect(() => {
    if (!controls) return undefined;

    controls.addEventListener('change', publish);

    return () => controls.removeEventListener('change', publish);
  }, [controls, publish]);

  useEffect(() => {
    const { version, zoomLevel } = request;

    if (appliedVersion.current === version) return;

    if (!Number.isFinite(zoomLevel) || zoomLevel <= 0) return;

    appliedVersion.current = version;

    if (isOrthographic(camera)) {
      camera.zoom = zoomLevel;
      camera.updateProjectionMatrix();
      publish();

      return;
    }

    const focus = getFocus();
    // read the view direction *before* moving, or the camera lands exactly on the focus point: the
    // receiver of `addScaledVector` is evaluated first, so a direction derived from `camera.position`
    // in the argument would be measured from a position already overwritten with `focus`
    const direction = getViewDirection(camera, focus);

    // along the current view direction, so the zoom changes how close the camera is and nothing else
    camera.position.copy(focus).addScaledVector(direction, getDistanceForZoom(camera, height, zoomLevel));
    camera.updateProjectionMatrix();
    // keeps the controls' own idea of where the camera is in step, and dispatches the `change` the
    // rest of the canvas listens for
    controls?.update();
    publish();
  }, [camera, controls, getFocus, height, publish, request]);

  return null;
};

export default ZoomController;
