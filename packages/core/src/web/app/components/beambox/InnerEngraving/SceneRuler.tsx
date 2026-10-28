import React, { useMemo } from 'react';

import { Html } from '@react-three/drei';

import { LABEL_OFFSET, LABEL_SCALE_RATIO, RULER_COLOR, TICK_LENGTH } from './constants';
import { MM_TO_SCENE } from './utils/coordinates';

interface SceneRulerProps {
  depth: number;
  height: number;
  step: number;
  width: number;
}

/**
 * Tick marks and measurements along the work area's near and left edges plus the vertical Z axis.
 *
 * This lives inside the scene rather than as a screen overlay, so it zooms and rotates with
 * everything else. Labels are `<Html transform>` (real DOM positioned in 3D) instead of drei
 * `<Text>`: the installed troika build has no default font bundled, so `<Text>` would need a font
 * file shipped and loaded, while DOM labels inherit the app's own typography.
 *
 * Ticks point away from the work area so they never overlap the model or the grid.
 */
const SceneRuler = ({ depth, height, step, width }: SceneRulerProps): React.JSX.Element => {
  const { labels, positions } = useMemo(() => {
    const points: number[] = [];
    const labels: Array<{ key: string; position: [number, number, number]; text: string }> = [];
    const toMm = (value: number) => `${Math.round(value / MM_TO_SCENE)}`;

    // X axis along the near edge (y = 0), ticks running outwards into negative Y
    for (let x = 0; x <= width; x += step) {
      points.push(x, 0, 0, x, -TICK_LENGTH, 0);
      labels.push({ key: `x${x}`, position: [x, -TICK_LENGTH - LABEL_OFFSET, 0], text: toMm(x) });
    }

    // Y axis along the left edge, ticks running outwards into negative X
    for (let y = 0; y <= height; y += step) {
      points.push(0, y, 0, -TICK_LENGTH, y, 0);
      labels.push({ key: `y${y}`, position: [-TICK_LENGTH - LABEL_OFFSET, y, 0], text: toMm(y) });
    }

    // Z axis rising from the origin corner. z = 0 is the focus origin and is already labelled by the
    // X/Y rulers meeting there, so start one step up
    points.push(0, 0, 0, 0, 0, depth);

    for (let z = step; z <= depth; z += step) {
      points.push(0, 0, z, -TICK_LENGTH, 0, z);
      labels.push({ key: `z${z}`, position: [-TICK_LENGTH - LABEL_OFFSET, 0, z], text: toMm(z) });
    }

    return { labels, positions: new Float32Array(points) };
  }, [depth, height, step, width]);

  return (
    <group>
      {/* keyed on the vertex count so the geometry is rebuilt rather than partially updated */}
      <lineSegments key={positions.length} raycast={() => null}>
        <bufferGeometry>
          <bufferAttribute args={[positions, 3]} attach="attributes-position" />
        </bufferGeometry>
        <lineBasicMaterial color={RULER_COLOR} />
      </lineSegments>
      {labels.map(({ key, position, text }) => (
        <Html
          center
          key={key}
          position={position}
          // sized from the grid step, which follows the camera distance, so the text stays about the
          // same size on screen however far out you zoom
          scale={step * LABEL_SCALE_RATIO}
          style={{ color: RULER_COLOR, fontSize: 12, pointerEvents: 'none', userSelect: 'none' }}
          transform
        >
          {text}
        </Html>
      ))}
    </group>
  );
};

export default SceneRuler;
