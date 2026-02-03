import Delaunator from 'delaunator';
import * as THREE from 'three';
import { match } from 'ts-pattern';

type Point3D = [number, number, number];
type Triangle = [Point3D, Point3D, Point3D];

const getEdgeLength2D = (p1: Point3D, p2: Point3D): number => Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);

const getMidpoint = (p1: Point3D, p2: Point3D): Point3D => [
  (p1[0] + p2[0]) / 2,
  (p1[1] + p2[1]) / 2,
  (p1[2] + p2[2]) / 2,
];

const getPlaneAngle = (p1: Point3D, p2: Point3D, p3: Point3D): number => {
  const v1 = new THREE.Vector3(p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]);
  const v2 = new THREE.Vector3(p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]);
  const normal = new THREE.Vector3();

  normal.crossVectors(v1, v2).normalize();

  let angle = THREE.MathUtils.radToDeg(normal.angleTo(new THREE.Vector3(0, 0, -1))); // deg

  angle = angle > 90 ? 180 - angle : angle;

  return angle;
};

/**
 * Subdivide triangles based on edge length using longest edge bisection algorithm.
 * For each triangle, if any edge's 2D Euclidean distance (x, y) exceeds interpolateLength,
 * the triangle is split by adding a vertex at the midpoint of the longest edge.
 * This process would not change the z profile of the surface.
 *
 * @param triangles - Array of triangles, each triangle is [p1, p2, p3] where each point is [x, y, z]
 * @param interpolateLength - Maximum acceptable 2D edge length before subdivision
 * @returns Array of subdivided triangles
 */
export const interpolateTriangles = (triangles: Triangle[], interpolateLength: number): Triangle[] => {
  const result: Triangle[] = [];
  const currentTriangles: Triangle[] = [...triangles];

  while (currentTriangles.length > 0) {
    const [p1, p2, p3] = currentTriangles.pop()!;
    const l12 = getEdgeLength2D(p1, p2);
    const l23 = getEdgeLength2D(p2, p3);
    const l31 = getEdgeLength2D(p3, p1);
    const maxLength = Math.max(l12, l23, l31);

    if (maxLength <= interpolateLength) {
      result.push([p1, p2, p3]);
      continue;
    }

    match(maxLength)
      .with(l12, () => {
        const m = getMidpoint(p1, p2);

        currentTriangles.push([p1, m, p3], [m, p2, p3]);
      })
      .with(l23, () => {
        const m = getMidpoint(p2, p3);

        currentTriangles.push([p1, p2, m], [p1, m, p3]);
      })
      .otherwise(() => {
        const m = getMidpoint(p3, p1);

        currentTriangles.push([p1, p2, m], [m, p2, p3]);
      });
  }

  return result;
};

export const createTriangularGeometry = (
  points: Point3D[],
  width: number,
  height: number,
  interpolateLength: number = 0,
) => {
  const delaunay = Delaunator.from(
    points,
    (p) => p[0],
    (p) => p[1],
  );

  // Extract triangles from Delaunay result
  const triangles: Triangle[] = [];

  for (let i = 0; i < delaunay.triangles.length; i += 3) {
    const p1 = points[delaunay.triangles[i]];
    const p2 = points[delaunay.triangles[i + 1]];
    const p3 = points[delaunay.triangles[i + 2]];

    triangles.push([p1, p2, p3]);
  }

  // Subdivide triangles based on edge length
  const subdividedTriangles = interpolateLength > 0 ? interpolateTriangles(triangles, interpolateLength) : triangles;

  // Build geometry arrays from subdivided triangles
  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];

  for (const [p1, p2, p3] of subdividedTriangles) {
    const baseIndex = vertices.length / 3;

    vertices.push(p1[0], p1[1], p1[2]);
    vertices.push(p2[0], p2[1], p2[2]);
    vertices.push(p3[0], p3[1], p3[2]);

    uvs.push(p1[0] / width + 0.5, p1[1] / height + 0.5);
    uvs.push(p2[0] / width + 0.5, p2[1] / height + 0.5);
    uvs.push(p3[0] / width + 0.5, p3[1] / height + 0.5);

    indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
};

export const setGeometryAngleAlertColor = (
  geometry: THREE.BufferGeometry,
  angleThreshold: number = 45,
  alertColor: [number, number, number] = [1, 2 / 3, 2 / 3],
  defaultColor: [number, number, number] = [1, 1, 1],
): number => {
  const positions = geometry.getAttribute('position');
  const colors = [];
  let maxAngle = 0;

  for (let i = 0; i < positions.count; i += 3) {
    const angle = getPlaneAngle(
      [positions.getX(i), positions.getY(i), positions.getZ(i)],
      [positions.getX(i + 1), positions.getY(i + 1), positions.getZ(i + 1)],
      [positions.getX(i + 2), positions.getY(i + 2), positions.getZ(i + 2)],
    );

    maxAngle = Math.max(maxAngle, angle);

    const color = angle > angleThreshold ? alertColor : defaultColor;

    colors.push(...color);
    colors.push(...color);
    colors.push(...color);
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  return maxAngle;
};
