import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { OrbitControls, TransformControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import type { Mesh } from 'three';
import { DoubleSide } from 'three';

import type { StlObject } from '@core/app/stores/stlStore';
import { useStlStore } from '@core/app/stores/stlStore';
import workareaManager from '@core/app/svgedit/workarea';
import { todo } from '@core/helpers/is-dev';

import styles from './InnerEngravingCanvas.module.scss';
import { svgToSceneY } from './utils/coordinates';
import { updateProjectionRect } from './utils/projection';

todo(
  '標明這些顏色來自哪裡，基本上是 scss 或 JS，確認沿用舊的顏色的話，最好對齊原本的寫法（例如 rgba）；scss container background color 實際上可以直接套用整個 beam studioo 的底色，不用另外設定，除非決定給內雕改成暗色模式，但容易影響到很多其他的顏色顯示',
);
todo('處理 layer color，見下方 TODO 註解');
todo('TBD with PM: 如何 highlight selected？');
todo('GRID_STEP 是否可以隨著縮放調整？');
todo('FIXME: 目前的畫布，從上往下只看得到灰色，要從下往上才看的到網格');
todo('three js 可以標記座標嗎？例如顯示 ruler、顯示立體網格');

todo('Check me!!!! Not completely reviewed.');

const FLOOR_COLOR = '#ffffff';
const GRID_COLOR = '#dadada';
const BACKGROUND_COLOR = '#f0f0f0';
// TODO: apply the layer colour, matching updateElementColor on the projection rect
const MESH_COLOR = '#333333';
const SELECTED_MESH_COLOR = '#1890ff';
const GRID_STEP = 100; // 10mm in scene units

interface StlMeshProps {
  object: StlObject;
  onSelect: (id: string) => void;
  selected: boolean;
}

const StlMesh = ({ object, onSelect, selected }: StlMeshProps) => {
  // a callback ref rather than useRef: TransformControls needs the resolved Object3D, which is not
  // available on the first render
  const [mesh, setMesh] = useState<Mesh | null>(null);
  const { geometry, id, matrix } = object;

  // the store holds the transform as a matrix; three.js drives its object off position/quaternion/
  // scale, so decompose on the way in and recompose on the way out
  useEffect(() => {
    if (!mesh) return;

    mesh.matrix.copy(matrix);
    mesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
  }, [matrix, mesh]);

  // while dragging, write straight to the projection rect and leave the store alone: updating the
  // store mid-drag would feed the matrix back through the effect above and fight the gizmo
  const handleObjectChange = useCallback(() => {
    const elem = document.getElementById(id) as null | SVGRectElement;

    if (!mesh || !elem) return;

    mesh.updateMatrix();
    updateProjectionRect(elem, geometry, mesh.matrix);
  }, [geometry, id, mesh]);

  // TODO: record an undo command for the move, see undoManager
  const handleDragEnd = useCallback(() => {
    if (!mesh) return;

    mesh.updateMatrix();
    useStlStore.getState().setMatrix(id, mesh.matrix.clone());
  }, [id, mesh]);

  return (
    <>
      <mesh
        geometry={geometry}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id);
        }}
        ref={setMesh}
      >
        <meshStandardMaterial color={selected ? SELECTED_MESH_COLOR : MESH_COLOR} />
      </mesh>
      {selected && mesh && (
        <TransformControls
          mode="translate"
          object={mesh}
          onMouseUp={handleDragEnd}
          onObjectChange={handleObjectChange}
        />
      )}
    </>
  );
};

const Scene = () => {
  const { objects, selectedId, setSelectedId } = useStlStore();
  const { height, width } = workareaManager;
  // the work area spans x: 0..width and y: -height..0 in scene space, because scene Y grows towards
  // the back while SVG Y grows downwards
  const center = useMemo<[number, number, number]>(() => [width / 2, svgToSceneY(height / 2), 0], [height, width]);
  const diagonal = useMemo(() => Math.hypot(width, height), [height, width]);

  return (
    <>
      <color args={[BACKGROUND_COLOR]} attach="background" />
      <ambientLight intensity={1.2} />
      <directionalLight intensity={2} position={[width, -height, diagonal]} />

      <mesh position={center} receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={FLOOR_COLOR} side={DoubleSide} />
      </mesh>
      <gridHelper
        args={[Math.max(width, height), Math.round(Math.max(width, height) / GRID_STEP), GRID_COLOR, GRID_COLOR]}
        position={center}
        // gridHelper lies in the XZ plane by default, stand it up onto the XY floor
        rotation={[Math.PI / 2, 0, 0]}
      />

      {Object.values(objects).map((object) => (
        <StlMesh key={object.id} object={object} onSelect={setSelectedId} selected={object.id === selectedId} />
      ))}

      <OrbitControls makeDefault target={center} />
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
  // default view: looking down at the work area from the front-right, matching the 2D canvas
  // orientation (X right, Y downwards on screen) with Z up
  const cameraPosition = useMemo<[number, number, number]>(
    () => [width / 2, svgToSceneY(height) - height, Math.max(width, height)],
    [height, width],
  );

  return (
    <div className={styles.container}>
      <Canvas
        camera={{
          far: Math.max(width, height) * 100,
          near: 1,
          position: cameraPosition,
          // Z is up: without this the orbit controls would spin around the wrong axis
          up: [0, 0, 1],
        }}
        onPointerMissed={() => useStlStore.getState().setSelectedId(null)}
      >
        <Scene />
      </Canvas>
    </div>
  );
};

export default InnerEngravingCanvas;
