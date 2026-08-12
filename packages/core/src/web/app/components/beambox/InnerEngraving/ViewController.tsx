import type React from 'react';
import { useEffect, useRef } from 'react';

import { OrthographicCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import type { OrthographicCamera as OrthographicCameraImpl, Vector3 } from 'three';

import { getPresetPosition, useViewStore } from './viewStore';

/** Only the part of OrbitControls used here, to avoid depending on drei's transitive three-stdlib. */
interface OrbitLike {
  target: Vector3;
  update: () => void;
}

/**
 * How much of the scene the orthographic camera shows, as a multiple of `extent`.
 *
 * Chosen to match what the perspective camera frames from its preset distance — a 50° vertical fov
 * at `extent * DISTANCE_RATIO` away covers about 1.5 times the extent — so switching projection
 * changes the projection and nothing else.
 */
const ORTHO_VIEW_HEIGHT_RATIO = 1.5;

interface ViewControllerProps {
  /** Roughly the size of what should stay in frame. */
  extent: number;
  /** What the camera orbits and points at — the material's centre, not the floor's. */
  target: [number, number, number];
}

/**
 * Orthographic camera that takes over as the default while it is mounted; drei restores the previous
 * default on unmount, so the perspective path — including the `up` fix in `onCreated` — is untouched.
 *
 * Its `zoom` is set once, from the canvas height, because an orthographic camera's framing does not
 * follow its distance the way a perspective one's does: mounted with the default zoom of 1 it reads
 * as being far too close. After that the controls own it.
 */
const OrthographicView = ({ extent }: { extent: number }) => {
  const cameraRef = useRef<OrthographicCameraImpl>(null);
  const height = useThree((state) => state.size.height);

  useEffect(() => {
    const camera = cameraRef.current;

    if (!camera) return;

    camera.up.set(0, 0, 1);
    // drei's frustum is the canvas in pixels, so the visible world height is `height / zoom`
    camera.zoom = height / (extent * ORTHO_VIEW_HEIGHT_RATIO);
    camera.updateProjectionMatrix();
    // deliberately mount-only: after this the controls own the camera, and re-running would fight them
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  return <OrthographicCamera far={extent * 20} makeDefault near={-extent * 20} ref={cameraRef} />;
};

/**
 * Applies the camera presets and the projection toggle from the view store.
 *
 * Lives inside the canvas so it can reach the camera and the default controls. Note that `up` is set
 * before every `lookAt`: a `lookAt` run against the default Y-up vector produces an orientation that
 * looks almost right but leaves the transform gizmo's axes off.
 *
 * ⚠️ Switching projection **re-applies the current preset** rather than carrying the camera's pose
 * across (`viewStore.setProjection` bumps the view for exactly that). Carrying it over is what the
 * earlier version tried, and the result never landed where the user had left it — the two frustums
 * frame a scene too differently for a matched pose to look matched. Snapping to a named view is at
 * least somewhere the user asked to be.
 */
const ViewController = ({ extent, target }: ViewControllerProps): null | React.JSX.Element => {
  const { camera, controls } = useThree();
  const projection = useViewStore((state) => state.projection);
  const view = useViewStore((state) => state.view);
  const appliedVersion = useRef(-1);

  useEffect(() => {
    // the camera object itself changes when the projection is toggled, which re-runs this effect.
    // Applying each request at most once is what stops an unrelated re-render from throwing away
    // whatever the user has orbited to
    if (view.preset === 'custom' || appliedVersion.current === view.version) return;

    const orbit = controls as null | OrbitLike;

    // OrbitControls mounts as a sibling, so on the first pass it may not exist yet. Waiting rather
    // than applying half of the state is what makes the initial view repeatable: applying the camera
    // now and letting the controls initialise afterwards left the final position dependent on which
    // of the two happened to run last.
    if (!orbit?.target) return;

    appliedVersion.current = view.version;

    camera.up.set(0, 0, 1);
    camera.position.set(...getPresetPosition(view.preset, target, extent));
    camera.lookAt(...target);
    camera.updateProjectionMatrix();

    orbit.target.set(...target);
    orbit.update();
    // `view.version` is the dependency that matters: it changes even when the preset does not, so
    // asking for the view you are already on still snaps back
  }, [camera, controls, extent, target, view]);

  return projection === 'orthographic' ? <OrthographicView extent={extent} /> : null;
};

export default ViewController;
