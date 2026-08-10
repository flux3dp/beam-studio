import React, { useMemo } from 'react';

import { Edges } from '@react-three/drei';
import { Plane, Vector3 } from 'three';
import { match } from 'ts-pattern';

import workareaManager from '@core/app/svgedit/workarea';

import { MATERIAL_COLOR, MATERIAL_OPACITY, OUT_OF_RANGE_COLOR, OUT_OF_RANGE_OPACITY } from './constants';
import type { Material } from './utils/material';

interface Props {
  material: Material;
}

/** A three.js clipping plane keeps the half-space where `normal · p + constant >= 0`. */
const plane = (normal: [number, number, number], constant: number) => new Plane(new Vector3(...normal), constant);

/**
 * The workpiece, drawn as a semi-transparent solid the STL objects sit inside.
 *
 * Purely a placement reference: the material is never sent to swiftray (which does no clipping), so
 * this only has to show the user where their workpiece is, and **which part of it the machine can
 * reach**. The part outside the work area is drawn in the same grey the 2D canvas uses for
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
  const { center, depth, height, shape, width } = material;
  const radius = width / 2;
  const { height: areaHeight, width: areaWidth } = workareaManager;

  const geometry = match(shape)
    .with('box', () => <boxGeometry args={[width, depth, height]} />)
    // three.js builds cylinders around Y, so the mesh below stands it up onto Z
    .with('cylinder', () => <cylinderGeometry args={[radius, radius, height, 64]} />)
    .with('sphere', () => {
      // the ball is filled with liquid of the same refractive index up to `height`, so anything
      // above that level is not part of the workpiece. theta is measured from the pole, which the
      // mesh rotation puts at +Z
      const thetaStart = Math.acos(Math.min(1, Math.max(-1, (height - radius) / radius)));

      return <sphereGeometry args={[radius, 64, 32, 0, Math.PI * 2, thetaStart, Math.PI - thetaStart]} />;
    })
    .exhaustive();

  const position: [number, number, number] = shape === 'sphere' ? [center[0], center[1], radius] : center;
  const rotation: [number, number, number] | undefined = shape === 'box' ? undefined : [Math.PI / 2, 0, 0];

  const regions = useMemo(() => {
    const insideArea = [
      plane([1, 0, 0], 0),
      plane([-1, 0, 0], areaWidth),
      plane([0, 1, 0], 0),
      plane([0, -1, 0], areaHeight),
    ];

    return [
      { clip: insideArea, color: MATERIAL_COLOR, edges: true, opacity: MATERIAL_OPACITY },
      // the four slabs outside the work area. They partition rather than overlap — the front and
      // back ones are also bounded in X — so the corners are not drawn twice, which with a
      // transparent material would show up as darker corners
      { clip: [plane([-1, 0, 0], 0)], color: OUT_OF_RANGE_COLOR, edges: false, opacity: OUT_OF_RANGE_OPACITY },
      { clip: [plane([1, 0, 0], -areaWidth)], color: OUT_OF_RANGE_COLOR, edges: false, opacity: OUT_OF_RANGE_OPACITY },
      {
        clip: [plane([0, -1, 0], 0), plane([1, 0, 0], 0), plane([-1, 0, 0], areaWidth)],
        color: OUT_OF_RANGE_COLOR,
        edges: false,
        opacity: OUT_OF_RANGE_OPACITY,
      },
      {
        clip: [plane([0, 1, 0], -areaHeight), plane([1, 0, 0], 0), plane([-1, 0, 0], areaWidth)],
        color: OUT_OF_RANGE_COLOR,
        edges: false,
        opacity: OUT_OF_RANGE_OPACITY,
      },
    ];
  }, [areaHeight, areaWidth]);

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
