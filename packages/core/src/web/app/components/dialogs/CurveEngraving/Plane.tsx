import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { useLoader, useThree } from '@react-three/fiber';
import Delaunator from 'delaunator';
import * as THREE from 'three';

import type { CurveEngraving as ICurveEngraving } from '@core/interfaces/ICurveEngraving';

interface PlaneProps {
  data: ICurveEngraving;
  selectedIndices?: Set<number>;
  textureSource?: string;
  toggleSelectedIndex?: (index: number) => void;
}

// TODO: Add unit tests
const Plane = ({
  data: {
    bbox: { height, width, x: bboxX, y: bboxY },
    gap,
    highest,
    points,
  },
  selectedIndices,
  textureSource = 'core-img/white.jpg',
  toggleSelectedIndex,
}: PlaneProps): React.JSX.Element => {
  const geoMeshRef = useRef<THREE.Mesh>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const texture = useLoader(THREE.TextureLoader, textureSource);
  const { camera, gl, scene } = useThree();
  const flattened = useMemo(
    // reverse y axis and z axis due to different coordinate system, swift half width and height to keep in the center
    () => points.flat().map((p) => [p[0] - bboxX - 0.5 * width, 0.5 * height - (p[1] - bboxY), p[2] ? -p[2] : p[2]]),
    [points, bboxX, bboxY, width, height],
  ) as Array<[number, number, null | number]>;
  const filteredPoints = useMemo(() => flattened.filter((p) => p[2] !== null), [flattened]) as Array<
    [number, number, number]
  >;

  const customGeometry = useMemo(() => {
    const vertices = [];
    const colors = [];
    const indices = [];
    const uvs = []; // UV coordinates
    const delaunay = Delaunator.from(
      filteredPoints,
      (p) => p[0],
      (p) => p[1],
    );

    for (let i = 0; i < delaunay.triangles.length; i += 3) {
      const p1 = filteredPoints[delaunay.triangles[i]];

      vertices.push(p1[0], p1[1], p1[2]);
      uvs.push(p1[0] / width + 0.5, p1[1] / height + 0.5);

      const p2 = filteredPoints[delaunay.triangles[i + 1]];

      vertices.push(p2[0], p2[1], p2[2]);
      uvs.push(p2[0] / width + 0.5, p2[1] / height + 0.5);

      const p3 = filteredPoints[delaunay.triangles[i + 2]];

      vertices.push(p3[0], p3[1], p3[2]);
      uvs.push(p3[0] / width + 0.5, p3[1] / height + 0.5);

      const v1 = new THREE.Vector3(p1[0], p1[1], p1[2]);
      const v2 = new THREE.Vector3(p2[0], p2[1], p2[2]);
      const v3 = new THREE.Vector3(p3[0], p3[1], p3[2]);
      const normal = new THREE.Vector3();

      normal.crossVectors(v2.sub(v1), v3.sub(v1)).normalize();

      let angle = THREE.MathUtils.radToDeg(normal.angleTo(new THREE.Vector3(0, 0, -1))); // deg

      angle = angle > 90 ? 180 - angle : angle;

      if (angle > 45) {
        colors.push(1, 2 / 3, 2 / 3);
        colors.push(1, 2 / 3, 2 / 3);
        colors.push(1, 2 / 3, 2 / 3);
      } else {
        colors.push(1, 1, 1);
        colors.push(1, 1, 1);
        colors.push(1, 1, 1);
      }

      indices.push(i, i + 1, i + 2);
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); // Set UVs
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }, [filteredPoints, width, height]);
  const gridGeometry = useMemo(() => new THREE.EdgesGeometry(customGeometry), [customGeometry]);
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
        <mesh key={i} position={[x, y, z ?? -highest]} userData={{ index: i, isSphere: true }}>
          <sphereGeometry args={[size, 16, 16]} />
          <meshBasicMaterial color={color} opacity={0.7} transparent />
        </mesh>
      );
    });

    return out;
  }, [flattened, highest, gap, selectedIndices, colors]);

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
      <mesh geometry={customGeometry} ref={geoMeshRef}>
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} transparent vertexColors />
      </mesh>
      <lineSegments geometry={gridGeometry} ref={lineRef}>
        <lineBasicMaterial color="black" linewidth={1} opacity={0.5} />
      </lineSegments>
      {spheres}
    </>
  );
};

export default Plane;
