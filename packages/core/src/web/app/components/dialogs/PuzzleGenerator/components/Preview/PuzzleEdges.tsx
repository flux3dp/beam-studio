import React, { memo } from 'react';

import type Konva from 'konva';
import { Group, Path } from 'react-konva';

import { STROKE_WIDTH } from '../../constants';

interface PuzzleEdgesProps {
  clipFunc?: (ctx: Konva.Context) => void;
  horizontalData: string;
  stroke: string;
  strokeWidth?: number;
  verticalData: string;
}

const PuzzleEdges = memo(
  ({ clipFunc, horizontalData, stroke, strokeWidth = STROKE_WIDTH, verticalData }: PuzzleEdgesProps) => (
    <Group clipFunc={clipFunc}>
      <Path data={horizontalData} fill="transparent" stroke={stroke} strokeWidth={strokeWidth} />
      <Path data={verticalData} fill="transparent" stroke={stroke} strokeWidth={strokeWidth} />
    </Group>
  ),
);

PuzzleEdges.displayName = 'PuzzleEdges';

export default PuzzleEdges;
