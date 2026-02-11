import React, { memo } from 'react';

import type Konva from 'konva';
import { Group, Path } from 'react-konva';

import type { ColorSet } from '../../constants';
import { STROKE_WIDTH } from '../../constants';

import PuzzleEdges from './PuzzleEdges';

interface PuzzleStackProps {
  borderEnabled: boolean;
  boundaryPath: string;
  clipFunc?: (ctx: Konva.Context) => void;
  colors: ColorSet;
  edges: { horizontalEdges: string; verticalEdges: string };
  imageOverlay?: React.ReactNode;
}

const PuzzleStack = memo(({ borderEnabled, boundaryPath, clipFunc, colors, edges, imageOverlay }: PuzzleStackProps) => {
  // When border is disabled, boundary belongs to puzzle pieces (no separate raised edges frame)
  const boundaryStroke = borderEnabled ? colors.raisedEdges : colors.pieces;

  return (
    <Group>
      {imageOverlay}
      <Path data={boundaryPath} fill={colors.fill} stroke={boundaryStroke} strokeWidth={STROKE_WIDTH} />
      <PuzzleEdges
        clipFunc={clipFunc}
        horizontalData={edges.horizontalEdges}
        stroke={colors.pieces}
        verticalData={edges.verticalEdges}
      />
    </Group>
  );
});

PuzzleStack.displayName = 'PuzzleStack';

export default PuzzleStack;
