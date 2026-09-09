import React, { useMemo } from 'react';

import { Edges } from '@react-three/drei';
import { Plane, Vector3 } from 'three';
import { match } from 'ts-pattern';

import workareaManager from '@core/app/svgedit/workarea';

import { MATERIAL_COLOR, MATERIAL_OPACITY, OUT_OF_RANGE_COLOR, OUT_OF_RANGE_OPACITY } from './constants';
import type { Material } from './utils/material';
import { getMaterialRotation } from './utils/materialGeometry';

interface Props {
  material: Material;
}

/** A three.js clipping plane keeps the half-space where `normal · p + constant >= 0`. */
const plane = (normal: [number, number, number], constant: number) => new Plane(new Vector3(...normal), constant);

// Scene coordinates use 10 units per mm. Treat sub-micron drift as touching the boundary rather
// than crossing it, so a clipping plane is never created just because of floating-point noise.
const BOUNDARY_EPSILON = 0.01;

/**
 * The workpiece, drawn as a semi-transparent solid the STL objects sit inside.
 *
 * This is the visual counterpart of the material Z interval sent to Swiftray: it shows where the
 * workpiece is and **which part of it the machine can reach**. Shape and XY placement remain
 * frontend-only. The part outside the work area is drawn in the same grey the 2D canvas uses for
 * everything outside the work area, so "grey means the laser cannot go there" reads the same in
 * both canvases.
 *
 * The split is done with clipping planes rather than by cutting geometry: the regions are
 * half-space intersections, which is exactly what clipping planes express, and it costs nothing to
 * follow a material or work area change. Requires `localClippingEnabled` on the renderer.
 *
 * It takes no pointer events, so clicking through it selects the object behind it.
 */
const MaterialShape = ({ material }: Props): React.JSX.Element => {
  const { center, depth, height, maxZ, minZ, shape, width, x, y } = material;
  const radius = width / 2;
  const { height: areaHeight, width: areaWidth } = workareaManager;

  const geometry = match(shape)
    .with('box', () => <boxGeometry args={[width, depth, height]} />)
    // three.js builds cylinders around Y, so the mesh below stands it up onto Z
    .with('cylinder', () => <cylinderGeometry args={[radius, radius, height, 64]} />)
    .with('sphere', () => {
      // Draw only the part below the liquid surface. Theta is measured from the pole, which the
      // mesh rotation puts at +Z; minZ shifts the whole ball up from the work platform.
      const centerZ = (minZ + maxZ) / 2;
      const submergedTop = Math.min(height, maxZ);
      const thetaStart = Math.acos(Math.min(1, Math.max(-1, (submergedTop - centerZ) / radius)));

      return <sphereGeometry args={[radius, 64, 32, 0, Math.PI * 2, thetaStart, Math.PI - thetaStart]} />;
    })
    .exhaustive();

  const position = center;
  const rotation = getMaterialRotation(shape);

  const regions = useMemo(() => {
    const maxX = x + width;
    const maxY = y + depth;
    const crossesLeft = x < -BOUNDARY_EPSILON;
    const crossesRight = maxX > areaWidth + BOUNDARY_EPSILON;
    const crossesFront = y < -BOUNDARY_EPSILON;
    const crossesBack = maxY > areaHeight + BOUNDARY_EPSILON;
    const overlapsAreaX = maxX > BOUNDARY_EPSILON && x < areaWidth - BOUNDARY_EPSILON;
    const overlapsAreaY = maxY > BOUNDARY_EPSILON && y < areaHeight - BOUNDARY_EPSILON;
    const insideArea: Plane[] = [];

    // Only clip a side when the material actually crosses it. A plane coincident with an exterior
    // face (for example a box starting at x = y = 0) is numerically unstable at grazing angles.
    if (crossesLeft) insideArea.push(plane([1, 0, 0], 0));

    if (crossesRight) insideArea.push(plane([-1, 0, 0], areaWidth));

    if (crossesFront) insideArea.push(plane([0, 1, 0], 0));

    if (crossesBack) insideArea.push(plane([0, -1, 0], areaHeight));

    const result: Array<{ clip: Plane[]; color: string; edges: boolean; opacity: number }> = [];

    if (overlapsAreaX && overlapsAreaY) {
      result.push({ clip: insideArea, color: MATERIAL_COLOR, edges: false, opacity: MATERIAL_OPACITY });
    }

    // The four outside slabs partition rather than overlap. Front and back only need an X bound
    // when a left/right slab exists; omitting unnecessary planes also prevents coincident faces.
    if (crossesLeft) {
      result.push({
        clip: [plane([-1, 0, 0], 0)],
        color: OUT_OF_RANGE_COLOR,
        edges: false,
        opacity: OUT_OF_RANGE_OPACITY,
      });
    }

    if (crossesRight) {
      result.push({
        clip: [plane([1, 0, 0], -areaWidth)],
        color: OUT_OF_RANGE_COLOR,
        edges: false,
        opacity: OUT_OF_RANGE_OPACITY,
      });
    }

    const middleX: Plane[] = [];

    if (crossesLeft) middleX.push(plane([1, 0, 0], 0));

    if (crossesRight) middleX.push(plane([-1, 0, 0], areaWidth));

    if (crossesFront && overlapsAreaX) {
      result.push({
        clip: [plane([0, -1, 0], 0), ...middleX],
        color: OUT_OF_RANGE_COLOR,
        edges: false,
        opacity: OUT_OF_RANGE_OPACITY,
      });
    }

    if (crossesBack && overlapsAreaX) {
      result.push({
        clip: [plane([0, 1, 0], -areaHeight), ...middleX],
        color: OUT_OF_RANGE_COLOR,
        edges: false,
        opacity: OUT_OF_RANGE_OPACITY,
      });
    }

    // Edges are not clipped, so attaching them to any one visible region outlines the whole shape.
    if (result[0]) result[0].edges = true;

    return result;
  }, [areaHeight, areaWidth, depth, width, x, y]);

  return (
    <>
      {regions.map(({ clip, color, edges, opacity }, index) => (
        <mesh key={index} position={position} raycast={() => null} rotation={rotation}>
          {geometry}
          {/* depthWrite off: a transparent solid that writes depth hides whatever is drawn after it */}
          <meshBasicMaterial clippingPlanes={clip} color={color} depthWrite={false} opacity={opacity} transparent />
          {/* one outline for the whole workpiece, drawn unclipped so the true extent stays readable */}
          {edges && <Edges color={MATERIAL_COLOR} opacity={MATERIAL_OPACITY + 0.1} />}
        </mesh>
      ))}
    </>
  );
};

export default MaterialShape;
