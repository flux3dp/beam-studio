import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AppstoreOutlined, BlockOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import type Konva from 'konva';
import { Group, Layer, Path, Stage } from 'react-konva';

import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';
import {
  calculateAllPieceVisibilities,
  calculateMergeGroups,
  calculatePuzzleLayout,
  generatePuzzleEdges,
} from './puzzleGenerator';
import { drawShapeClipPath, generateBorderPath, generateShapePath, type ShapeType } from './shapeGenerators';
import type { PuzzleState, PuzzleTypeConfig } from './types';

interface Props {
  dimensions: { height: number; width: number };
  onViewModeChange: (mode: 'assembled' | 'layers') => void;
  state: PuzzleState;
  typeConfig: PuzzleTypeConfig;
  viewMode: 'assembled' | 'layers';
}

/**
 * Edge-based puzzle preview component
 *
 * Renders puzzles using edge paths (horizontal + vertical cuts) instead of individual pieces.
 * Uses clipFunc to clip edges to the boundary shape (ellipse/heart).
 */
const Preview = ({ dimensions, onViewModeChange, state, typeConfig, viewMode }: Props): React.JSX.Element => {
  const { puzzle_generator: t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [stageSize, setStageSize] = useState({ height: 300, width: 400 });

  const shapeType = typeConfig.gridGenerator as ShapeType;
  const isRectangle = shapeType === 'rectangle';

  // Calculate piece visibilities and merge groups for non-rectangle shapes
  const mergeGroups = useMemo(() => {
    if (isRectangle) return [];

    const visibilities = calculateAllPieceVisibilities(state, typeConfig.gridGenerator);

    return calculateMergeGroups(visibilities, state.rows, state.columns, 0.5, typeConfig.gridGenerator, state);
  }, [state, typeConfig.gridGenerator, isRectangle]);

  // Generate edge-based paths (with merged piece edges removed)
  const puzzleEdges = useMemo(
    () => generatePuzzleEdges(state, typeConfig.gridGenerator, mergeGroups),
    [state, typeConfig.gridGenerator, mergeGroups],
  );

  // Get puzzle layout for centering calculations
  const puzzleLayout = useMemo(() => calculatePuzzleLayout(state), [state]);

  // Generate boundary path using consolidated shape generator
  const boundaryPath = useMemo(
    () =>
      generateShapePath(shapeType, {
        height: puzzleLayout.height,
        width: puzzleLayout.width,
      }),
    [shapeType, puzzleLayout.height, puzzleLayout.width],
  );

  // Generate border path if border is enabled
  const borderPath = useMemo(() => {
    if (!state.border.enabled) return '';

    return generateBorderPath(shapeType, {
      borderWidth: state.border.width,
      cornerRadius: state.border.radius,
      height: puzzleLayout.height,
      width: puzzleLayout.width,
    });
  }, [state.border.enabled, state.border.width, state.border.radius, shapeType, puzzleLayout]);

  // Calculate the bounding box for proper scaling (including border if enabled)
  const puzzleBounds = useMemo(() => {
    const borderOffset = state.border.enabled ? state.border.width : 0;

    return {
      height: puzzleLayout.height + borderOffset * 2,
      width: puzzleLayout.width + borderOffset * 2,
      x: puzzleLayout.offsetX - borderOffset,
      y: puzzleLayout.offsetY - borderOffset,
    };
  }, [puzzleLayout, state.border.enabled, state.border.width]);

  // Handle container resize
  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const { height, width } = entries[0].contentRect;

      setStageSize({ height, width });
    });

    observer.observe(container);
    setStageSize({
      height: container.clientHeight,
      width: container.clientWidth,
    });

    return () => observer.disconnect();
  }, []);

  // Calculate scale to fit puzzle in view
  const scale = useMemo(() => {
    const padding = 40;
    const availableWidth = stageSize.width - padding * 2;
    const availableHeight = stageSize.height - padding * 2;

    if (puzzleBounds.width === 0 || puzzleBounds.height === 0) return 1;

    return Math.min(availableWidth / puzzleBounds.width, availableHeight / puzzleBounds.height);
  }, [stageSize, puzzleBounds]);

  // Center offset
  const offset = useMemo(
    () => ({
      x: stageSize.width / 2,
      y: stageSize.height / 2,
    }),
    [stageSize],
  );

  // Create clip function for Konva Group using consolidated shape generator
  const clipFunc = useCallback(
    (ctx: Konva.Context) => {
      if (isRectangle) return;

      drawShapeClipPath(
        ctx as unknown as CanvasRenderingContext2D,
        shapeType,
        puzzleLayout.width,
        puzzleLayout.height,
        state.border.radius,
      );
    },
    [isRectangle, shapeType, puzzleLayout.width, puzzleLayout.height, state.border.radius],
  );

  // Render assembled view (default)
  const renderAssembledView = () => (
    <Group scaleX={scale} scaleY={scale} x={offset.x} y={offset.y}>
      {/* Border path (if enabled) - rendered FIRST (behind) with white fill */}
      {borderPath && <Path data={borderPath} fill="#ffffff" stroke="#333333" strokeWidth={0.5} />}

      {/* Boundary shape with white fill (the puzzle background) */}
      <Path data={boundaryPath} fill="#ffffff" stroke="#333333" strokeWidth={0.5} />

      {/* Clipped group for edge cuts */}
      <Group clipFunc={isRectangle ? undefined : clipFunc}>
        {puzzleEdges.horizontalEdges && (
          <Path data={puzzleEdges.horizontalEdges} fill="transparent" stroke="#333333" strokeWidth={0.5} />
        )}
        {puzzleEdges.verticalEdges && (
          <Path data={puzzleEdges.verticalEdges} fill="transparent" stroke="#333333" strokeWidth={0.5} />
        )}
      </Group>
    </Group>
  );

  // Render layers view (shows puzzle and border as separate entities)
  const renderLayersView = () => {
    const layerGap = 20; // Gap between layers in the view
    const hasBorder = state.border.enabled && borderPath;

    // Calculate positions for side-by-side layout
    const puzzleOffsetX = hasBorder ? -layerGap / 2 - state.border.width : 0;
    const borderOffsetX = hasBorder ? puzzleLayout.width / 2 + layerGap / 2 + state.border.width : 0;

    return (
      <Group scaleX={scale * 0.8} scaleY={scale * 0.8} x={offset.x} y={offset.y}>
        {/* Puzzle layer */}
        <Group x={puzzleOffsetX}>
          <Path data={boundaryPath} fill="#ffffff" stroke="#333333" strokeWidth={0.5} />
          <Group clipFunc={isRectangle ? undefined : clipFunc}>
            {puzzleEdges.horizontalEdges && (
              <Path data={puzzleEdges.horizontalEdges} fill="transparent" stroke="#333333" strokeWidth={0.5} />
            )}
            {puzzleEdges.verticalEdges && (
              <Path data={puzzleEdges.verticalEdges} fill="transparent" stroke="#333333" strokeWidth={0.5} />
            )}
          </Group>
        </Group>

        {/* Border layer (if enabled) - shown separately */}
        {hasBorder && (
          <Group x={borderOffsetX}>
            <Path data={borderPath} fill="#f0f0f0" stroke="#0066cc" strokeWidth={0.5} />
          </Group>
        )}
      </Group>
    );
  };

  return (
    <div className={styles['preview-area']}>
      {/* Dimension display */}
      <div className={styles['preview-header']}>
        {dimensions.width}mm × {dimensions.height}mm
      </div>

      {/* Konva canvas */}
      <div className={styles['preview-canvas']} ref={containerRef}>
        <Stage height={stageSize.height} ref={stageRef} width={stageSize.width}>
          <Layer>{viewMode === 'assembled' ? renderAssembledView() : renderLayersView()}</Layer>
        </Stage>
      </div>

      {/* View mode toggle buttons */}
      <div className={styles['preview-footer']}>
        <Tooltip title={t.assembled_view}>
          <Button
            icon={<BlockOutlined />}
            onClick={() => onViewModeChange('assembled')}
            type={viewMode === 'assembled' ? 'primary' : 'default'}
          />
        </Tooltip>
        <Tooltip title={t.layers_view}>
          <Button
            icon={<AppstoreOutlined />}
            onClick={() => onViewModeChange('layers')}
            type={viewMode === 'layers' ? 'primary' : 'default'}
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default Preview;
