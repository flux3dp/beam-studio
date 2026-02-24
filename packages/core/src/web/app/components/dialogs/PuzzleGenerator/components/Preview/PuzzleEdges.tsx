import React, { memo } from 'react';

import type Konva from 'konva';
import { Group, Path } from 'react-konva';

interface PuzzleEdgesProps {
  clipFunc?: (ctx: Konva.Context) => void;
  horizontalData: string;
  stroke: string;
  strokeWidth: number;
  verticalData: string;
}

const PuzzleEdges = memo(({ clipFunc, horizontalData, stroke, strokeWidth, verticalData }: PuzzleEdgesProps) => (
  <Group clipFunc={clipFunc}>
    <Path data={horizontalData} fill="transparent" stroke={stroke} strokeWidth={strokeWidth} />
    <Path data={verticalData} fill="transparent" stroke={stroke} strokeWidth={strokeWidth} />
  </Group>
));

PuzzleEdges.displayName = 'PuzzleEdges';

export default PuzzleEdges;
