import type React from 'react';
import { useEffect, useRef } from 'react';

import { OrthographicCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import type { OrthographicCamera as OrthographicCameraImpl, Vector3 } from 'three';
import { MathUtils, Quaternion, Vector3 as Vector3Impl } from 'three';

import { DISTANCE_RATIO, getPresetPosition, useViewStore } from './viewStore';

/** Only the part of OrbitControls used here, to avoid depending on drei's transitive three-stdlib. */
interface OrbitLike {
  target: Vector3;
  update: () => void;
}

interface CameraPose {
  /** Vertical field of view of the last perspective camera seen, for matching orthographic zoom. */
  fov: number;
  position: Vector3Impl;
  quaternion: Quaternion;
}

interface ViewControllerProps {
  /** Roughly the size of what should stay in frame. */
  extent: number;
  /** What the camera orbits and points at — the material's centre, not the floor's. */
  target: [number, number, number];
}

interface OrthographicViewProps {
  extent: number;
  pose: React.RefObject<CameraPose>;
  target: [number, number, number];
}

/**
 * Orthographic camera that takes over as the default while it is mounted; drei restores the previous
 * default on unmount, so the perspective path — including the `up` fix in `onCreated` — is untouched.
 *
 * It adopts the pose the perspective camera was last at and picks a `zoom` reproducing the same
 * framing: a perspective camera at distance `d` shows `2 * d * tan(fov / 2)` of world height, an
 * orthographic one shows `canvasHeight / zoom`. Without this it lands at the origin with zoom 1,
 * which reads as being far too close to the model.
 */
const OrthographicView = ({ extent, pose, target }: OrthographicViewProps) => {
  const cameraRef = useRef<OrthographicCameraImpl>(null);
  const size = useThree((state) => state.size);

  useEffect(() => {
    const camera = cameraRef.current;

    if (!camera) return;

    const { fov, position, quaternion } = pose.current;
    const distance = position.distanceTo(new Vector3Impl(...target)) || extent * DISTANCE_RATIO;

    camera.up.set(0, 0, 1);
    camera.position.copy(position);
    camera.quaternion.copy(quaternion);
    camera.zoom = size.height / (2 * distance * Math.tan(MathUtils.degToRad(fov) / 2));
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
 */
const ViewController = ({ extent, target }: ViewControllerProps): null | React.JSX.Element => {
  const { camera, controls } = useThree();
  const projection = useViewStore((state) => state.projection);
  const view = useViewStore((state) => state.view);
  // tracks whichever camera is currently the default, so switching projection carries the pose over
  const pose = useRef<CameraPose>({ fov: 50, position: new Vector3Impl(), quaternion: new Quaternion() });
  const appliedVersion = useRef(-1);

  useFrame(({ camera: active }) => {
    pose.current.position.copy(active.position);
    pose.current.quaternion.copy(active.quaternion);

    if ('fov' in active) pose.current.fov = active.fov as number;
  });

  useEffect(() => {
    // the camera object itself changes when the projection is toggled, which re-runs this effect.
    // Applying each request at most once is what stops that toggle from throwing away whatever the
    // user had orbited to; the new camera inherits the old one's pose instead.
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

  // going back to perspective: drei hands the default back to the camera the canvas created, which
  // still holds the pose it had when orthographic took over, so carry the current one across
  useEffect(() => {
    if (projection !== 'perspective') return;

    camera.up.set(0, 0, 1);
    camera.position.copy(pose.current.position);
    camera.quaternion.copy(pose.current.quaternion);
    camera.updateProjectionMatrix();
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [projection]);

  return projection === 'orthographic' ? <OrthographicView extent={extent} pose={pose} target={target} /> : null;
};

export default ViewController;
