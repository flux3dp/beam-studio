import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LoopSubdivision } from 'three-subdivide';

import curveEngravingModeController from '@core/app/actions/canvas/curveEngravingModeController';
import type { CurveEngraving, Point } from '@core/interfaces/ICurveEngraving';

import { createTriangularGeometry, setGeometryAngleAlertColor } from './utils/createTriangularGeometry';
import { retrievePointsFromGeometry } from './utils/retrievePointsFromGeometry';
import type { PointsData } from './utils/usePointsData';

interface Props {
  data: CurveEngraving;
  doSubdivision?: boolean;
  loopSubdivisionIter?: number;
  maxEdgeLength?: number;
  pointsData: PointsData;
  selectedIndices?: Set<number>;
  textureSource?: string;
  toggleSelectedIndex?: (index: number) => void;
}

// TODO: Add unit tests
const Plane = ({
  data: { gap },
  doSubdivision,
  loopSubdivisionIter = 1,
  maxEdgeLength = 15,
  pointsData,
  selectedIndices,
  textureSource = 'core-img/white.jpg',
  toggleSelectedIndex,
}: Props): React.JSX.Element => {
  const geoMeshRef = useRef<THREE.Mesh>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const texture = useLoader(THREE.TextureLoader, textureSource);
  const { camera, gl, scene } = useThree();
  const flattened = useMemo(() => pointsData.displayPoints.flat(), [pointsData]);
  const filteredPoints = useMemo(() => flattened.filter((p) => p[2] !== null), [flattened]) as Array<
    [number, number, number]
  >;

  const customGeometry = useMemo(
    () => createTriangularGeometry(filteredPoints, pointsData.width, pointsData.height, maxEdgeLength),
    [filteredPoints, pointsData, maxEdgeLength],
  );

  const subdividedGeometry = useMemo(() => {
    return LoopSubdivision.modify(customGeometry, loopSubdivisionIter, { preserveEdges: true });
  }, [customGeometry, loopSubdivisionIter]);

  // TODO: should I do this here?
  const subdividedPoints = useMemo<Point[]>(
    () => retrievePointsFromGeometry(subdividedGeometry, pointsData).map((p) => [p[0], p[1], p[2]]),
    [subdividedGeometry, pointsData],
  );

  useMemo(() => {
    curveEngravingModeController.setSubdividedPoints(doSubdivision ? subdividedPoints : null);
  }, [subdividedPoints, doSubdivision]);

  useMemo(() => {
    setGeometryAngleAlertColor(customGeometry);
  }, [customGeometry]);

  useMemo(() => {
    setGeometryAngleAlertColor(subdividedGeometry);
  }, [subdividedGeometry]);

  const gridGeometry = useMemo(() => new THREE.WireframeGeometry(customGeometry), [customGeometry]);
  const subdividedWireFrame = useMemo(() => new THREE.WireframeGeometry(subdividedGeometry), [subdividedGeometry]);
  const colors = useMemo(
    () => ({
      blue: new THREE.Color(0x1890ff),
      gray: new THREE.Color(0x494949),
      red: new THREE.Color(0xfe4348),
    }),
    [],
  );
  const spheres = useMemo(() => {
    const size = 0.1 * Math.min(gap[0], gap[1]);
    const out = flattened.map(([x, y, z], i) => {
      let color;

      if (selectedIndices?.has(i)) {
        color = colors.blue;
      } else if (z === null) {
        color = colors.red;
      } else {
        color = colors.gray;
      }

      return (
        <mesh
          key={i}
          position={[x, y, z ?? -(pointsData.maxZ - pointsData.depth)]}
          userData={{ index: i, isSphere: true }}
        >
          <sphereGeometry args={[size, 16, 16]} />
          <meshBasicMaterial color={color} opacity={0.7} transparent />
        </mesh>
      );
    });

    return out;
  }, [flattened, pointsData, gap, selectedIndices, colors]);

  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      const { offsetX, offsetY } = event;
      const canvas = event.target as HTMLCanvasElement;
      const { offsetHeight, offsetWidth } = canvas;
      const mouse = new THREE.Vector2();

      mouse.x = (offsetX / offsetWidth) * 2 - 1;
      mouse.y = -(offsetY / offsetHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();

      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const intersected = intersects[0].object;

        if (intersected.userData.isSphere) {
          toggleSelectedIndex?.(intersected.userData.index);
        }
      }
    },
    [camera, scene, toggleSelectedIndex],
  );

  useEffect(() => {
    gl.domElement.addEventListener('pointerdown', handlePointerDown);

    return () => {
      gl.domElement.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [gl.domElement, handlePointerDown]);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const { offsetX, offsetY } = event;
      const canvas = event.target as HTMLCanvasElement;
      const { offsetHeight, offsetWidth } = canvas;
      const mouse = new THREE.Vector2();

      mouse.x = (offsetX / offsetWidth) * 2 - 1;
      mouse.y = -(offsetY / offsetHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();

      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const intersected = intersects[0].object;

        if (intersected.userData.isSphere) {
          canvas.style.cursor = 'pointer';

          return;
        }
      }

      canvas.style.cursor = 'grab';
    },
    [camera, scene],
  );

  useEffect(() => {
    gl.domElement.addEventListener('pointermove', handlePointerMove);

    return () => {
      gl.domElement.removeEventListener('pointermove', handlePointerMove);
    };
  }, [gl.domElement, handlePointerMove]);

  return (
    <>
      <mesh geometry={doSubdivision ? subdividedGeometry : customGeometry} ref={geoMeshRef}>
        <meshBasicMaterial map={texture} opacity={0.7} side={THREE.DoubleSide} transparent vertexColors />
      </mesh>
      {doSubdivision ? (
        <lineSegments geometry={subdividedWireFrame} ref={lineRef}>
          <lineBasicMaterial color="blue" linewidth={1} opacity={0.3} />
        </lineSegments>
      ) : (
        <lineSegments geometry={gridGeometry} ref={lineRef}>
          <lineBasicMaterial color="black" linewidth={1} opacity={0.5} />
        </lineSegments>
      )}
      {spheres}
    </>
  );
};

export default Plane;
