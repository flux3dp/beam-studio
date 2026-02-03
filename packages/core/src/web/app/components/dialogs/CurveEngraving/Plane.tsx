import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import type { CurveEngraving } from '@core/interfaces/ICurveEngraving';

import type { ThreeDisplayData } from './utils/preprocessData';

interface Props {
  data: CurveEngraving;
  displayData: ThreeDisplayData;
  doSubdivision?: boolean;
  selectedIndices?: Set<number>;
  textureSource?: string;
  toggleSelectedIndex?: (index: number) => void;
}

// TODO: Add unit tests
const Plane = ({
  data: { gap },
  displayData,
  doSubdivision,
  selectedIndices,
  textureSource = 'core-img/white.jpg',
  toggleSelectedIndex,
}: Props): React.JSX.Element => {
  const geoMeshRef = useRef<THREE.Mesh>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const texture = useLoader(THREE.TextureLoader, textureSource);
  const { camera, gl, scene } = useThree();
  const { depth, displayPoints, geometry, maxZ, subdividedGeometry } = displayData;
  const gridGeometry = useMemo(() => new THREE.WireframeGeometry(geometry), [geometry]);
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
    const out = displayPoints.map(([x, y, z], i) => {
      let color;

      if (selectedIndices?.has(i)) {
        color = colors.blue;
      } else if (z === null) {
        color = colors.red;
      } else {
        color = colors.gray;
      }

      return (
        <mesh key={i} position={[x, y, z ?? -(maxZ - depth)]} userData={{ index: i, isSphere: true }}>
          <sphereGeometry args={[size, 16, 16]} />
          <meshBasicMaterial color={color} opacity={0.7} transparent />
        </mesh>
      );
    });

    return out;
  }, [displayPoints, depth, maxZ, gap, selectedIndices, colors]);

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
      const sphere = intersects.find((intersect) => intersect.object.userData.isSphere);

      if (sphere) {
        toggleSelectedIndex?.(sphere.object.userData.index);

        return;
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
      const sphere = intersects.find((intersect) => intersect.object.userData.isSphere);

      if (sphere) {
        canvas.style.cursor = 'pointer';

        return;
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
      <mesh geometry={doSubdivision ? subdividedGeometry : geometry} ref={geoMeshRef}>
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
