import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AppstoreOutlined, BlockOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import type Konva from 'konva';
import { Group, Layer, Path, Stage } from 'react-konva';
import { match } from 'ts-pattern';

import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';
import {
  calculateAllPieceVisibilities,
  calculateMergeGroups,
  calculatePuzzleLayout,
  generatePuzzleEdges,
} from './puzzleGenerator';
import type { PuzzleState, PuzzleTypeConfig } from './types';

interface Props {
  dimensions: { height: number; width: number };
  onViewModeChange: (mode: 'assembled' | 'exploded') => void;
  state: PuzzleState;
  typeConfig: PuzzleTypeConfig;
  viewMode: 'assembled' | 'exploded';
}

/**
 * Edge-based puzzle preview component
 *
 * Renders puzzles using edge paths (horizontal + vertical cuts) instead of individual pieces.
 * Uses clipFunc to clip edges to the boundary shape (ellipse/heart).
 * This approach:
 * - Naturally shows merged edges (edges between merged pieces are already removed)
 * - Clips edges outside the boundary using Konva's clipFunc
 * - Matches the exported result exactly
 */
const Preview = ({ dimensions, onViewModeChange, state, typeConfig, viewMode }: Props): React.JSX.Element => {
  const { puzzle_generator: t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ height: 300, width: 400 });

  // Calculate piece visibilities and merge groups for non-rectangle shapes
  const mergeGroups = useMemo(() => {
    if (typeConfig.gridGenerator === 'rectangle') {
      return [];
    }

    const visibilities = calculateAllPieceVisibilities(state, typeConfig.gridGenerator);

    return calculateMergeGroups(visibilities, state.rows, state.columns, 0.5);
  }, [state, typeConfig.gridGenerator]);

  // Generate edge-based paths (with merged piece edges removed)
  const puzzleEdges = useMemo(
    () => generatePuzzleEdges(state, typeConfig.gridGenerator, mergeGroups),
    [state, typeConfig.gridGenerator, mergeGroups],
  );

  // Get puzzle layout for centering calculations
  const puzzleLayout = useMemo(() => calculatePuzzleLayout(state), [state]);

  // Calculate the bounding box for proper scaling
  const puzzleBounds = useMemo(
    () => ({
      height: puzzleLayout.height,
      width: puzzleLayout.width,
      x: puzzleLayout.offsetX,
      y: puzzleLayout.offsetY,
    }),
    [puzzleLayout],
  );

  // Handle container resize
  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const { height, width } = entries[0].contentRect;

      setStageSize({ height, width });
    });

    observer.observe(container);

    // Initial size
    setStageSize({
      height: container.clientHeight,
      width: container.clientWidth,
    });

    return () => observer.disconnect();
  }, []);

  // Calculate scale to fit puzzle in view - always fill the available space
  const scale = useMemo(() => {
    const padding = 40;
    const availableWidth = stageSize.width - padding * 2;
    const availableHeight = stageSize.height - padding * 2;

    if (puzzleBounds.width === 0 || puzzleBounds.height === 0) {
      return 1;
    }

    const scaleX = availableWidth / puzzleBounds.width;
    const scaleY = availableHeight / puzzleBounds.height;

    return Math.min(scaleX, scaleY);
  }, [stageSize, puzzleBounds]);

  // Center offset - position the content in the center of the stage
  const offset = useMemo(
    () => ({
      x: stageSize.width / 2,
      y: stageSize.height / 2,
    }),
    [stageSize],
  );

  // Determine if we need clipping (for non-rectangle shapes)
  const needsClipping = typeConfig.gridGenerator !== 'rectangle';

  // Create clip function for Konva Group using native canvas drawing methods
  // This clips the edge paths to the boundary shape (ellipse/heart)
  const clipFunc = useCallback(
    (ctx: Konva.Context) => {
      if (!needsClipping) return;

      const { columns, pieceSize, rows } = state;
      const width = columns * pieceSize;
      const height = rows * pieceSize;

      ctx.beginPath();

      match(typeConfig.gridGenerator)
        .with('circle', () => {
          ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
        })
        .with('heart', () => {
          const topCurveHeight = height * 0.3;
          const halfWidth = width / 2;
          const halfHeight = height / 2;

          const topY = -halfHeight;
          const notchY = topY + topCurveHeight;
          const bottomY = halfHeight;

          const bottomCtrl1Y = bottomY * 0.4;
          const bottomCtrl2Y = bottomY * 0.8;

          ctx.moveTo(0, notchY);
          ctx.bezierCurveTo(0, topY, -halfWidth, topY, -halfWidth, notchY);
          ctx.bezierCurveTo(-halfWidth, bottomCtrl1Y, -halfWidth * 0.3, bottomCtrl2Y, 0, bottomY);
          ctx.bezierCurveTo(halfWidth * 0.3, bottomCtrl2Y, halfWidth, bottomCtrl1Y, halfWidth, notchY);
          ctx.bezierCurveTo(halfWidth, topY, 0, topY, 0, notchY);
        })
        .otherwise(() => {});

      ctx.closePath();
      // Note: Konva handles clip() internally after this function
    },
    [needsClipping, state, typeConfig.gridGenerator],
  );

  return (
    <div className={styles['preview-area']}>
      {/* Dimension display */}
      <div className={styles['preview-header']}>
        {dimensions.width}mm × {dimensions.height}mm
      </div>

      {/* Konva canvas */}
      <div className={styles['preview-canvas']} ref={containerRef}>
        <Stage height={stageSize.height} ref={stageRef} width={stageSize.width}>
          <Layer>
            {/* Edge-based rendering with clipping */}
            <Group scaleX={scale} scaleY={scale} x={offset.x} y={offset.y}>
              {/* Boundary shape with white fill (the puzzle background) */}
              <Path data={puzzleEdges.boundaryPath} fill="#ffffff" stroke="#333333" strokeWidth={0.5} />

              {/* Clipped group for edge cuts - clips to boundary shape */}
              <Group clipFunc={needsClipping ? clipFunc : undefined}>
                {/* Horizontal edge cuts (between rows) */}
                {puzzleEdges.horizontalEdges && (
                  <Path data={puzzleEdges.horizontalEdges} fill="transparent" stroke="#333333" strokeWidth={0.5} />
                )}

                {/* Vertical edge cuts (between columns) */}
                {puzzleEdges.verticalEdges && (
                  <Path data={puzzleEdges.verticalEdges} fill="transparent" stroke="#333333" strokeWidth={0.5} />
                )}
              </Group>
            </Group>
          </Layer>
        </Stage>
      </div>

      {/* View mode toggle buttons - only show for types that support exploded view */}
      {typeConfig.supportsExplodedView && (
        <div className={styles['preview-footer']}>
          <Tooltip title={t.assembled_view ?? 'Assembled View'}>
            <Button
              icon={<BlockOutlined />}
              onClick={() => onViewModeChange('assembled')}
              type={viewMode === 'assembled' ? 'primary' : 'default'}
            />
          </Tooltip>
          <Tooltip title={t.exploded_view ?? 'Exploded View'}>
            <Button
              icon={<AppstoreOutlined />}
              onClick={() => onViewModeChange('exploded')}
              type={viewMode === 'exploded' ? 'primary' : 'default'}
            />
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default Preview;
