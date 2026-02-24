import React, { memo } from 'react';

import { Group, Path } from 'react-konva';

import { GUIDE_STROKE_RATIO } from '../../constants';

import type { ViewLayout } from './computeViewLayout';
import type { SceneProps } from './DesignScene';
import PuzzleEdges from './PuzzleEdges';
import PuzzleStack from './PuzzleStack';

interface ExplodedSceneProps extends SceneProps {
  guideLines: boolean;
  layout: ViewLayout;
}

const ExplodedScene = memo(
  ({
    borderEnabled,
    clipFunc,
    colors,
    geometry,
    guideLines,
    imageOverlay,
    layout,
    strokeWidth,
  }: ExplodedSceneProps) => (
    <Group>
      {layout.showExploded ? (
        <>
          <Group x={layout.raisedEdgesX}>
            {/* Image renders first (below raised edges) so bleed doesn't cover the frame */}
            {imageOverlay}
            <Path
              data={geometry.raisedEdgesPath}
              fill={colors.fill}
              fillRule="evenodd"
              stroke={colors.raisedEdges}
              strokeWidth={strokeWidth}
            />
            <PuzzleStack
              borderEnabled={borderEnabled}
              boundaryPath={geometry.boundaryPath}
              clipFunc={clipFunc}
              colors={colors}
              edges={geometry.edges}
              strokeWidth={strokeWidth}
            />
          </Group>
          <Group x={layout.boardX}>
            <Path
              data={geometry.boardBasePath}
              fill={colors.fill}
              stroke={colors.boardBase}
              strokeWidth={strokeWidth}
            />
            {guideLines && (
              <PuzzleEdges
                clipFunc={clipFunc}
                horizontalData={geometry.edges.horizontalEdges}
                stroke={colors.guideLines}
                strokeWidth={strokeWidth * GUIDE_STROKE_RATIO}
                verticalData={geometry.edges.verticalEdges}
              />
            )}
          </Group>
        </>
      ) : (
        <PuzzleStack
          borderEnabled={borderEnabled}
          boundaryPath={geometry.boundaryPath}
          clipFunc={clipFunc}
          colors={colors}
          edges={geometry.edges}
          imageOverlay={imageOverlay}
          strokeWidth={strokeWidth}
        />
      )}
    </Group>
  ),
);

ExplodedScene.displayName = 'ExplodedScene';

export default ExplodedScene;
