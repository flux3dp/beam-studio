import type React from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { OrthographicCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import type { Camera, OrthographicCamera as OrthographicCameraImpl } from 'three';
import { Vector3 } from 'three';

import type { SceneCamera } from './utils/camera';
import { getDistanceForZoom, getViewDirection, getZoomLevel, isOrthographic } from './utils/camera';
import { getPresetPosition, useViewStore } from './viewStore';

/** Only the parts of OrbitControls used here, to avoid depending on drei's transitive three-stdlib. */
interface OrbitLike {
  addEventListener: (type: string, listener: () => void) => void;
  removeEventListener: (type: string, listener: () => void) => void;
  target: Vector3;
  update: () => void;
}

/** Z up, as everywhere else in this canvas. */
const UP: [number, number, number] = [0, 0, 1];

interface ViewControllerProps {
  /** Roughly the size of what should stay in frame. */
  extent: number;
  /** What the camera orbits and points at — the material's centre, not the floor's. */
  target: [number, number, number];
}

/**
 * Points `to` at the same thing `from` was pointing at, across the two projections.
 *
 * Orientation carries over directly. Framing cannot: a perspective camera's scale comes from its
 * distance and an orthographic one's from its `zoom`, so there is no shared pose to copy. What the
 * two do share is how large a scene unit lands on screen at the orbit target — the zoom level the
 * control displays — so that is the quantity held fixed, and whichever term the receiving camera
 * expresses it through is solved for.
 */
const transferPose = (from: Camera, to: SceneCamera, focus: Vector3, canvasHeight: number): void => {
  const level = getZoomLevel(from, canvasHeight, focus);

  to.up.copy(from.up);
  to.quaternion.copy(from.quaternion);

  if (isOrthographic(to)) {
    // distance is free for an orthographic camera, so the position carries over untouched
    to.position.copy(from.position);
    to.zoom = level;
  } else {
    // ...and is the whole of it for a perspective one, so it is the term that has to be solved for.
    // The direction is read before the move: `addScaledVector`'s receiver is evaluated first, so a
    // direction taken from `to.position` inside the argument would be measured after the overwrite
    const direction = getViewDirection(from, focus);

    to.position.copy(focus).addScaledVector(direction, getDistanceForZoom(to, canvasHeight, level));
  }

  to.updateProjectionMatrix();
};

interface OrthographicViewProps {
  extent: number;
  /**
   * The live orbit target. Deliberately the caller's own Vector3 rather than a copy: it is read at
   * mount and again at unmount, and by then whatever the user has panned to is the right answer.
   */
  focus: Vector3;
}

/**
 * Orthographic camera that takes over as the default while it is mounted; drei restores the previous
 * default on unmount, so the perspective path — including the `up` fix in `onCreated` — is untouched.
 *
 * Both ends of the swap are posed here rather than in an effect on the outside, and that is the
 * point of the component: drei makes its camera the default from a *layout* effect, so anything
 * reacting to the swap afterwards is a commit or two late and the misplaced camera gets drawn in the
 * meantime. Seeding this one through props puts it in the right place before it is ever the default,
 * and posing the outgoing one from this component's cleanup — which runs after drei's, so the
 * restore has already happened — does the same on the way back.
 */
const OrthographicView = ({ extent, focus }: OrthographicViewProps) => {
  const cameraRef = useRef<OrthographicCameraImpl>(null);
  const canvasHeight = useThree((state) => state.size.height);
  const defaultCamera = useThree((state) => state.camera);
  // the camera this one stands in for, captured before drei swaps it out. drei restores this exact
  // object, having captured it the same way, so it is also the one to hand the pose back to
  const replaced = useRef(defaultCamera);
  const [seed] = useState(() => ({
    position: replaced.current.position.toArray() as [number, number, number],
    quaternion: replaced.current.quaternion.toArray() as [number, number, number, number],
    // pixels per scene unit is what an orthographic camera's `zoom` already means, so the perspective
    // camera's framing needs no conversion beyond being measured
    zoom: getZoomLevel(replaced.current, canvasHeight, focus),
  }));
  // read from the cleanup below, by which time the props are gone
  const latest = useRef({ canvasHeight, focus });

  useLayoutEffect(() => {
    latest.current = { canvasHeight, focus };
  });

  useLayoutEffect(() => {
    const camera = cameraRef.current;

    return () => {
      if (camera) transferPose(camera, replaced.current, latest.current.focus, latest.current.canvasHeight);
    };
  }, []);

  // near is negative so geometry behind the camera still renders: orbited under the floor, an
  // orthographic camera would otherwise clip away everything it was looking at
  return (
    <OrthographicCamera
      far={extent * 20}
      makeDefault
      near={-extent * 20}
      position={seed.position}
      quaternion={seed.quaternion}
      ref={cameraRef}
      up={UP}
      zoom={seed.zoom}
    />
  );
};

/**
 * Applies the camera presets and the projection toggle from the view store.
 *
 * Lives inside the canvas so it can reach the camera and the default controls. Note that `up` is set
 * before every `lookAt`: a `lookAt` run against the default Y-up vector produces an orientation that
 * looks almost right but leaves the transform gizmo's axes off.
 *
 * Toggling the projection replaces the camera object rather than reconfiguring it, and drei builds
 * the replacement from nothing. `OrthographicView` carries the pose across; what is left over here
 * is the orbit target, which belongs to the OrbitControls instance — and drei rebuilds that too,
 * because it is memoised on the default camera.
 */
const ViewController = ({ extent, target }: ViewControllerProps): null | React.JSX.Element => {
  const camera = useThree((state) => state.camera);
  const controls = useThree((state) => state.controls) as null | OrbitLike;
  const projection = useViewStore((state) => state.projection);
  const view = useViewStore((state) => state.view);
  const appliedVersion = useRef(-1);
  // the live orbit target, which a pan walks away from `target`. Kept out here because the controls
  // that hold it are thrown away and rebuilt on every projection toggle, taking the pan with them
  const orbitTarget = useRef(new Vector3(...target));
  const restoredControls = useRef<null | OrbitLike>(null);

  useEffect(() => {
    // the camera object itself changes when the projection is toggled, which re-runs this effect.
    // Applying each request at most once is what stops an unrelated re-render from throwing away
    // whatever the user has orbited to
    if (view.preset === 'custom' || appliedVersion.current === view.version) return;

    // OrbitControls mounts as a sibling, so on the first pass it may not exist yet. Waiting rather
    // than applying half of the state is what makes the initial view repeatable: applying the camera
    // now and letting the controls initialise afterwards left the final position dependent on which
    // of the two happened to run last.
    if (!controls?.target) return;

    appliedVersion.current = view.version;

    camera.up.set(0, 0, 1);
    camera.position.set(...getPresetPosition(view.preset, target, extent));
    camera.lookAt(...target);
    camera.updateProjectionMatrix();

    controls.target.set(...target);
    controls.update();
    // `view.version` is the dependency that matters: it changes even when the preset does not, so
    // asking for the view you are already on still snaps back
  }, [camera, controls, extent, target, view]);

  // Rebuilt controls start back at the preset target. Without putting the pan back, the `update()`
  // the controls run every frame would re-aim the camera at somewhere the user had panned away from.
  useEffect(() => {
    if (!controls || restoredControls.current === controls) return;

    restoredControls.current = controls;
    controls.target.copy(orbitTarget.current);
    controls.update();
  }, [controls]);

  // declared after the restore so that on a rebuild it records the target that was put back, rather
  // than the freshly reset one it would otherwise see first
  useEffect(() => {
    if (!controls) return undefined;

    const record = () => orbitTarget.current.copy(controls.target);

    record();
    controls.addEventListener('change', record);

    return () => controls.removeEventListener('change', record);
  }, [controls]);

  return projection === 'orthographic' ? <OrthographicView extent={extent} focus={orbitTarget.current} /> : null;
};

export default ViewController;
