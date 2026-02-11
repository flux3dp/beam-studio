import React, { memo } from 'react';

import type Konva from 'konva';
import { Group, Path } from 'react-konva';

import type { ColorSet } from '../../constants';
import type { PuzzleGeometry } from '../../types';

import PuzzleStack from './PuzzleStack';

export interface SceneProps {
  borderEnabled: boolean;
  clipFunc?: (ctx: Konva.Context) => void;
  colors: ColorSet;
  geometry: PuzzleGeometry;
  imageOverlay?: React.ReactNode;
  strokeWidth: number;
}

const DesignScene = memo(({ borderEnabled, clipFunc, colors, geometry, imageOverlay, strokeWidth }: SceneProps) => (
  <Group>
    {geometry.boardBasePath && (
      <Path data={geometry.boardBasePath} fill={colors.fill} stroke={colors.boardBase} strokeWidth={strokeWidth} />
    )}
    <PuzzleStack
      borderEnabled={borderEnabled}
      boundaryPath={geometry.boundaryPath}
      clipFunc={clipFunc}
      colors={colors}
      edges={geometry.edges}
      imageOverlay={imageOverlay}
      strokeWidth={strokeWidth}
    />
  </Group>
));

DesignScene.displayName = 'DesignScene';

export default DesignScene;
