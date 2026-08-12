import React, { useEffect, useMemo, useRef, useState } from 'react';

import { GizmoHelper, GizmoViewport, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import classNames from 'classnames';
import { DoubleSide, MOUSE, Vector3 } from 'three';

import { useCanvasStore } from '@core/app/stores/canvas/canvasStore';
import { useGlobalPreferenceStore } from '@core/app/stores/globalPreferenceStore';
import { useSelectedElementStore } from '@core/app/stores/selectedElementStore';
import { useStlStore } from '@core/app/stores/stlStore';
import workareaManager from '@core/app/svgedit/workarea';
import { todo } from '@core/helpers/is-dev';

import CanvasControls from './CanvasControls';
import { AXIS_COLORS, BACKGROUND_COLOR, FLOOR_COLOR, FLOOR_MARGIN, FLOOR_Z, GRID_STEPS, TARGET_GRID_CELLS } from './constants';
import styles from './InnerEngravingCanvas.module.scss';
import MaterialShape from './MaterialShape';
import SceneGrid from './SceneGrid';
import SceneRuler from './SceneRuler';
import StlMesh from './StlMesh';
import { getMaterial, useMaterial } from './utils/material';
import { getSelectedStlId, selectStlObject } from './utils/selection';
import ViewController from './ViewController';
import { DEFAULT_VIEW, getPresetPosition, useViewStore } from './viewStore';

todo(
  '標明這些顏色來自哪裡，基本上是 scss 或 JS，確認沿用舊的顏色的話，最好對齊原本的寫法（例如 rgba）；scss container background color 實際上可以直接套用整個 beam studio 的底色，不用另外設定，除非決定給內雕改成暗色模式，但容易影響到很多其他的顏色顯示',
);

/** Orbit on the left button, pan on the right — the three.js default, and the 3D convention. */
const MOUSE_BUTTONS = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN };
/**
 * The two swapped, for as long as the space bar is held.
 *
 * Space + left drag pans the SVG canvas, and it has to mean the same thing here or the one gesture
 * shared by both canvases would do opposite things depending on the mode. The right button picks up
 * what the left gave away rather than being disabled, so orbiting is still reachable mid-pan.
 */
const SPACE_MOUSE_BUTTONS = { LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE };

/**
 * Grid/ruler spacing that follows the zoom level, so the spacing stays readable instead of turning
 * into a solid block when zoomed out or a single cell when zoomed in.
 */
const useAdaptiveStep = (center: [number, number, number]): number => {
  const [step, setStep] = useState(GRID_STEPS[2]);
  const target = useMemo(() => new Vector3(...center), [center]);

  useFrame(({ camera }) => {
    const ideal = camera.position.distanceTo(target) / TARGET_GRID_CELLS;
    const next = GRID_STEPS.find((candidate) => candidate >= ideal) ?? GRID_STEPS[GRID_STEPS.length - 1];

    // only crosses a threshold occasionally, so this does not re-render every frame
    if (next !== step) setStep(next);
  });

  return step;
};

const Scene = () => {
  const { objects, selectedId } = useStlStore();
  const spaceKey = useCanvasStore((state) => state.spaceKey);
  const selectedElement = useSelectedElementStore((state) => state.selectedElement);
  const { height, width } = workareaManager;
  const material = useMaterial();
  // scene X/Y are the SVG coordinates, so the work area spans x: 0..width, y: 0..height
  const center = useMemo<[number, number, number]>(() => [width / 2, height / 2, 0], [height, width]);
  // the camera aims at the middle of the material rather than the floor: the material can be taller
  // than the work area is wide, so orbiting the floor leaves it running off the top of the screen
  const viewTarget = useMemo<[number, number, number]>(
    () => [width / 2, height / 2, material.height / 2],
    [height, material.height, width],
  );
  const viewExtent = useMemo(() => Math.max(width, height, material.height), [height, material.height, width]);
  const diagonal = useMemo(() => Math.hypot(width, height), [height, width]);
  const step = useAdaptiveStep(center);
  // the same two View menu items the 2D canvas answers to, so one setting means one thing in both
  const showGrids = useGlobalPreferenceStore((state) => state.show_grids);
  const showRulers = useGlobalPreferenceStore((state) => state.show_rulers);
  // walls tall enough for the workpiece, and never a degenerate zero-height box
  const wallHeight = useMemo(() => Math.max(material.height, step), [material.height, step]);

  // the other direction of the sync in `selectStlObject`: selecting through the layer panel, undo,
  // or anything else that moves svgedit's selection has to light up the mesh too
  useEffect(() => {
    useStlStore.getState().setSelectedId(getSelectedStlId(selectedElement));
  }, [selectedElement]);

  // true only between an OrbitControls pointer down and up, so a `change` can be attributed to the user
  const interacting = useRef(false);

  return (
    <>
      <color args={[BACKGROUND_COLOR]} attach="background" />
      <ambientLight intensity={1.2} />
      <directionalLight intensity={2} position={[width, -height, diagonal]} />
      {/* reaches past the work area so its edge is not flush with the boundary */}
      <mesh position={[center[0], center[1], FLOOR_Z]}>
        <planeGeometry args={[width + FLOOR_MARGIN * 2, height + FLOOR_MARGIN * 2]} />
        {/* unlit: the work area floor is a flat #fff backdrop like the 2D canvas, not a lit surface */}
        <meshBasicMaterial color={FLOOR_COLOR} side={DoubleSide} />
      </mesh>
      {showGrids && <SceneGrid depth={wallHeight} height={height} step={step} width={width} />}
      {showRulers && <SceneRuler depth={wallHeight} height={height} step={step} width={width} />}

      {/* the workpiece, positioned by InnerEngravingSettings and not movable on the canvas */}
      <MaterialShape material={material} />

      {Object.values(objects).map((object) => (
        <StlMesh
          key={object.id}
          object={object}
          onSelect={selectStlObject}
          panning={spaceKey}
          selected={object.id === selectedId}
        />
      ))}

      <ViewController extent={viewExtent} target={viewTarget} />
      {/* the axes indicator, grouped with the grids because it is the same kind of guide. Clicking
          an axis flies the camera there, which is a view the presets know nothing about, so the
          highlight has to be cleared the same way an orbit clears it */}
      {showGrids && (
        <GizmoHelper alignment="bottom-left" margin={[80, 80]} onUpdate={useViewStore.getState().markViewCustom}>
          <GizmoViewport axisColors={AXIS_COLORS as unknown as [string, string, string]} labelColor="#fff" />
        </GizmoHelper>
      )}
      {/* clamped to the upper hemisphere: everything worth looking at is above the focus plane, and
          orbiting under the floor only ever produces a confusing view of the material's underside.

          Dropping out of a preset needs both signals: `start`/`end` say an interaction is in flight,
          `change` says the camera actually moved. `start` alone fires on any pointer down, so
          clicking an object or dragging its gizmo would clear the preset; `change` alone fires on
          the programmatic `update()` the presets themselves do. */}
      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2}
        mouseButtons={spaceKey ? SPACE_MOUSE_BUTTONS : MOUSE_BUTTONS}
        onChange={() => {
          if (interacting.current) useViewStore.getState().markViewCustom();
        }}
        onEnd={() => {
          interacting.current = false;
        }}
        onStart={() => {
          interacting.current = true;
        }}
        target={viewTarget}
      />
    </>
  );
};

/**
 * The 3D canvas shown in place of the SVG canvas while inner engraving mode is on.
 *
 * The SVG canvas stays mounted underneath (hidden) because `svgcontent` still holds the layers and
 * the projection rects; this canvas renders the STL 3D objects those rects stand for.
 */
const InnerEngravingCanvas = (): React.JSX.Element => {
  const { height, width } = workareaManager;
  const spaceKey = useCanvasStore((state) => state.spaceKey);
  // read once rather than subscribed: this only seeds the first frame, after which the camera
  // belongs to OrbitControls and re-seeding it would yank the view out from under the user
  const materialHeight = useMemo(() => getMaterial().height, []);
  // matches ViewController's isometric preset, so the first frame is already the default view
  const viewTarget = useMemo<[number, number, number]>(
    () => [width / 2, height / 2, materialHeight / 2],
    [height, materialHeight, width],
  );
  // same helper ViewController uses, so the first frame already matches the default preset exactly
  const cameraPosition = useMemo<[number, number, number]>(
    () => getPresetPosition(DEFAULT_VIEW, viewTarget, Math.max(width, height, materialHeight)),
    [height, materialHeight, viewTarget, width],
  );

  return (
    <div className={classNames(styles.container, { [styles.panning]: spaceKey })}>
      <Canvas
        camera={{
          // a tight near/far range keeps depth precision usable; with near = 1 (0.1mm) almost the
          // whole depth buffer would be spent on the first few millimetres in front of the camera
          far: Math.max(width, height) * 20,
          near: 10,
          position: cameraPosition,
        }}
        // no tone mapping: r3f defaults to ACES filmic, which renders #fff as a washed-out grey and
        // shifts every colour away from the value written here
        flat
        // per-material clipping planes, which is how MaterialShape separates the part of the
        // workpiece the machine can reach from the part outside the work area
        gl={{ localClippingEnabled: true }}
        /**
         * Z is up. This has to happen here rather than through the `camera` prop above: r3f applies
         * those props and orients the camera before a late `up` would be picked up, leaving the
         * camera's rotation built against the default Y-up vector. The result looks almost right but
         * leaves the transform gizmo's axes off, which is exactly the bug this fixes. Setting `up`
         * and re-running `lookAt` once the camera exists rebuilds the orientation from the right
         * vector, and OrbitControls then reads the same `up` on every update.
         */
        onCreated={({ camera }) => {
          camera.up.set(0, 0, 1);
          camera.lookAt(...viewTarget);
        }}
        // a pan that starts on empty space is not a click on empty space: it must not deselect
        onPointerMissed={() => {
          if (!useCanvasStore.getState().spaceKey) selectStlObject(null);
        }}
      >
        <Scene />
      </Canvas>
      <CanvasControls />
    </div>
  );
};

export default InnerEngravingCanvas;
