import React, { memo } from 'react';

import { Group, Path } from 'react-konva';

import { GUIDE_STROKE_WIDTH, STROKE_WIDTH } from '../../constants';

import type { ViewLayout } from './computeViewLayout';
import type { SceneProps } from './DesignScene';
import PuzzleEdges from './PuzzleEdges';
import PuzzleStack from './PuzzleStack';

interface ExplodedSceneProps extends SceneProps {
  guideLines: boolean;
  layout: ViewLayout;
}

const ExplodedScene = memo(
  ({ borderEnabled, clipFunc, colors, geometry, guideLines, imageOverlay, layout }: ExplodedSceneProps) => (
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
              strokeWidth={STROKE_WIDTH}
            />
            <PuzzleStack
              borderEnabled={borderEnabled}
              boundaryPath={geometry.boundaryPath}
              clipFunc={clipFunc}
              colors={colors}
              edges={geometry.edges}
            />
          </Group>
          <Group x={layout.boardX}>
            <Path
              data={geometry.boardBasePath}
              fill={colors.fill}
              stroke={colors.boardBase}
              strokeWidth={STROKE_WIDTH}
            />
            {guideLines && (
              <PuzzleEdges
                clipFunc={clipFunc}
                horizontalData={geometry.edges.horizontalEdges}
                stroke={colors.guideLines}
                strokeWidth={GUIDE_STROKE_WIDTH}
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
        />
      )}
    </Group>
  ),
);

ExplodedScene.displayName = 'ExplodedScene';

export default ExplodedScene;
