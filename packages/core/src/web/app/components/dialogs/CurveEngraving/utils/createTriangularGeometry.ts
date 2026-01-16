import Delaunator from 'delaunator';
import * as THREE from 'three';

export const createTriangularGeometry = (points: Array<[number, number, number]>, width: number, height: number) => {
  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = []; // UV coordinates
  const delaunay = Delaunator.from(
    points,
    (p) => p[0],
    (p) => p[1],
  );

  console.log('delaunay', delaunay);

  for (let i = 0; i < delaunay.triangles.length; i += 3) {
    // Add triangle
    for (let j = 0; j < 3; j++) {
      const point = points[delaunay.triangles[i + j]];

      vertices.push(point[0], point[1], point[2]);
      uvs.push(point[0] / width + 0.5, point[1] / height + 0.5);
      indices.push(i + j);
    }
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); // Set UVs
  geometry.setIndex(indices);

  console.log(geometry);

  interpolateTriangularGeometry(geometry, width, height);

  geometry.computeVertexNormals();

  console.log(geometry);

  return geometry;
};

export const interpolateTriangularGeometry = (geometry: THREE.BufferGeometry, width: number, height: number) => {
  const positions = geometry.getAttribute('position');
  const newPositions: number[] = [];
  const newUVs: number[] = [];
  const newIndices: number[] = [];

  for (let i = 0; i < positions.count; i += 3) {
    /** Triangle: add p4, p5, p6
     *    p1----------p2        p1----p4----p2
     *     \          /          \   /  \   /
     *      \        /            \ /    \ /
     *       \      /     ==>     p5------p6
     *        \    /                \    /
     *         \  /                  \  /
     *          p3                    p3
     */

    const p1 = new THREE.Vector3(positions.getX(i), positions.getY(i), positions.getZ(i));
    const p2 = new THREE.Vector3(positions.getX(i + 1), positions.getY(i + 1), positions.getZ(i + 1));
    const p3 = new THREE.Vector3(positions.getX(i + 2), positions.getY(i + 2), positions.getZ(i + 2));
    const p4 = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const p5 = new THREE.Vector3().addVectors(p1, p3).multiplyScalar(0.5);
    const p6 = new THREE.Vector3().addVectors(p2, p3).multiplyScalar(0.5);

    const triangles = [
      [p1, p4, p5],
      [p4, p2, p6],
      [p5, p6, p3],
      [p4, p6, p5],
    ];

    for (const points of triangles) {
      newPositions.push(points[0].x, points[0].y, points[0].z);
      newPositions.push(points[1].x, points[1].y, points[1].z);
      newPositions.push(points[2].x, points[2].y, points[2].z);

      newUVs.push(points[0].x / width + 0.5, points[0].y / height + 0.5);
      newUVs.push(points[1].x / width + 0.5, points[1].y / height + 0.5);
      newUVs.push(points[2].x / width + 0.5, points[2].y / height + 0.5);
      newIndices.push(newIndices.length, newIndices.length + 1, newIndices.length + 2);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(newUVs, 2));
  geometry.setIndex(newIndices);
  // geometry.computeVertexNormals();
};

export const setGeometryAngleAlertColor = (
  geometry: THREE.BufferGeometry,
  angleThreshold: number = 45,
  alertColor: [number, number, number] = [1, 2 / 3, 2 / 3],
  defaultColor: [number, number, number] = [1, 1, 1],
) => {
  const positions = geometry.getAttribute('position');
  const colors = [];

  for (let i = 0; i < positions.count; i += 3) {
    const v1 = new THREE.Vector3(positions.getX(i), positions.getY(i), positions.getZ(i));
    const v2 = new THREE.Vector3(positions.getX(i + 1), positions.getY(i + 1), positions.getZ(i + 1));
    const v3 = new THREE.Vector3(positions.getX(i + 2), positions.getY(i + 2), positions.getZ(i + 2));
    const normal = new THREE.Vector3();

    normal.crossVectors(v2.sub(v1), v3.sub(v1)).normalize();

    let angle = THREE.MathUtils.radToDeg(normal.angleTo(new THREE.Vector3(0, 0, -1))); // deg

    angle = angle > 90 ? 180 - angle : angle;

    const color = angle > angleThreshold ? alertColor : defaultColor;

    colors.push(...color);
    colors.push(...color);
    colors.push(...color);
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
};
