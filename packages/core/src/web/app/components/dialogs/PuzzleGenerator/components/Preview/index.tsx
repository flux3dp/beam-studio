import React, { useEffect, useMemo } from 'react';

import { Tooltip } from 'antd';
import classNames from 'classnames';
import type Konva from 'konva';
import { Group, Image, Layer, Stage } from 'react-konva';
import useImage from 'use-image';

import { useStorageStore } from '@core/app/stores/storageStore';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import { COLORS, MM_PER_INCH, OVERLAY_BOTTOM, STAGE_PADDING, STROKE_PX, THUMB_PAD, THUMB_SIZE } from '../../constants';
import type { ViewMode } from '../../constants';
import { computeImagePlacement, computePuzzleGeometry, drawShapeClipPath } from '../../geometry';
import useContainerSize from '../../hooks/useContainerSize';
import type { ClipContext, PuzzleGeometry, PuzzleState, PuzzleTypeConfig } from '../../types';

import computeViewLayout from './computeViewLayout';
import DesignScene from './DesignScene';
import ExplodedScene from './ExplodedScene';
import styles from './Preview.module.scss';

interface PreviewProps {
  dimensions: { height: number; width: number };
  onGeometryComputed?: (geometry: PuzzleGeometry) => void;
  onViewModeChange: (mode: ViewMode) => void;
  state: PuzzleState;
  typeConfig: PuzzleTypeConfig;
  viewMode: ViewMode;
}

const Preview = ({
  dimensions,
  onGeometryComputed,
  onViewModeChange,
  state,
  typeConfig,
  viewMode,
}: PreviewProps): React.JSX.Element => {
  const { puzzle_generator: t } = useI18n();
  const isMobile = useIsMobile();
  const isInch = useStorageStore((s) => s.isInch);
  const { containerRef, size: stageSize } = useContainerSize();

  const shapeType = typeConfig.id;
  const colors = COLORS[viewMode];

  // Destructure geometry-affecting fields for stable memoization
  const { border, columns, image, orientation, pieceSize, rows, tabSize, typeId } = state;
  const puzzleRadius = 'radius' in state ? state.radius : undefined;

  // Core data — only recompute when geometry-affecting fields change
  // (excludes viewMode, image.*, etc.)
  const geometry = useMemo(
    () => computePuzzleGeometry(state, shapeType),
    // eslint-disable-next-line hooks/exhaustive-deps
    [
      border.enabled,
      border.radius,
      border.width,
      columns,
      image.bleed,
      image.dataUrl,
      image.enabled,
      orientation,
      pieceSize,
      puzzleRadius,
      rows,
      shapeType,
      tabSize,
      typeId,
    ],
  );

  // Report geometry to parent for export optimization
  useEffect(() => {
    onGeometryComputed?.(geometry);
  }, [geometry, onGeometryComputed]);

  const { meta } = geometry;

  // Clip functions for boundary and image
  const createClipFunc =
    (clipContext: ClipContext): ((ctx: Konva.Context) => void) =>
    (ctx: Konva.Context) =>
      drawShapeClipPath(ctx as unknown as CanvasRenderingContext2D, clipContext);

  const boundaryClip = useMemo(() => {
    if (meta.fillsBoundingBox) return undefined;

    return createClipFunc(geometry.clipContext);
  }, [meta.fillsBoundingBox, geometry.clipContext]);

  const imageClip = useMemo(() => {
    const expandedContext: ClipContext = {
      ...geometry.clipContext,
      height: geometry.clipContext.height + state.image.bleed * 2,
      width: geometry.clipContext.width + state.image.bleed * 2,
    };

    return createClipFunc(expandedContext);
  }, [state.image.bleed, geometry.clipContext]);

  // View layout
  const viewLayout = useMemo(
    () =>
      computeViewLayout(
        viewMode,
        stageSize.width,
        stageSize.height,
        STAGE_PADDING,
        OVERLAY_BOTTOM,
        geometry,
        state.border.enabled,
      ),
    [stageSize, viewMode, geometry, state.border.enabled],
  );

  // Image overlay rendering
  const [konvaImage, imageStatus] = useImage(
    state.image.enabled && state.image.dataUrl ? state.image.dataUrl : '',
    'anonymous',
  );

  useEffect(() => {
    if (imageStatus === 'failed') {
      console.warn('Failed to load preview image from data URL');
    }
  }, [imageStatus]);

  const imageLayout = useMemo(() => {
    if (!konvaImage || !state.image.enabled) return null;

    return computeImagePlacement(konvaImage.width, konvaImage.height, geometry.layout, state.image);
  }, [konvaImage, state.image, geometry.layout]);

  const imageOverlayNode =
    konvaImage && imageLayout ? (
      <Group clipFunc={imageClip}>
        <Image
          height={imageLayout.height}
          image={konvaImage}
          width={imageLayout.width}
          x={imageLayout.x}
          y={imageLayout.y}
        />
      </Group>
    ) : undefined;

  // Scene renderer (design vs exploded)
  // Exploded view represents exported output — hide image when exportAs is 'none' (alignment-only)
  // Stroke width is scale-compensated so lines stay a constant pixel thickness on screen
  const renderScene = (mode: ViewMode, sceneColors: typeof colors, layout: typeof viewLayout) => {
    const showImage = mode === 'design' || state.image.exportAs !== 'none';
    const strokeWidth = STROKE_PX / layout.scale;

    return mode === 'design' ? (
      <DesignScene
        borderEnabled={state.border.enabled}
        clipFunc={boundaryClip}
        colors={sceneColors}
        geometry={geometry}
        imageOverlay={showImage ? imageOverlayNode : undefined}
        strokeWidth={strokeWidth}
      />
    ) : (
      <ExplodedScene
        borderEnabled={state.border.enabled}
        clipFunc={boundaryClip}
        colors={sceneColors}
        geometry={geometry}
        guideLines={state.border.guideLines}
        imageOverlay={showImage ? imageOverlayNode : undefined}
        layout={layout}
        strokeWidth={strokeWidth}
      />
    );
  };

  // Thumbnails
  const thumbConfigs = useMemo(
    () =>
      (['design', 'exploded'] as const).map((mode) => ({
        layout: computeViewLayout(mode, THUMB_SIZE, THUMB_SIZE, THUMB_PAD, THUMB_PAD, geometry, state.border.enabled),
        mode,
      })),
    [geometry, state.border.enabled],
  );

  // Legend (exploded mode only)
  const legendEntries = useMemo(() => {
    if (viewMode !== 'exploded') return [];

    return [
      state.border.enabled && { color: COLORS.exploded.raisedEdges, label: t.raised_edges },
      { color: COLORS.exploded.pieces, label: t.puzzle_pieces },
      state.border.enabled && { color: COLORS.exploded.boardBase, label: t.board_base },
      state.border.guideLines && { color: COLORS.exploded.guideLines, label: t.guide_lines },
    ].filter(Boolean) as Array<{ color: string; label: string }>;
  }, [viewMode, state.border.enabled, state.border.guideLines, t]);

  // Dimension display
  const dimensionText = isInch
    ? `${(dimensions.width / MM_PER_INCH).toFixed(2)}in × ${(dimensions.height / MM_PER_INCH).toFixed(2)}in`
    : `${dimensions.width}mm × ${dimensions.height}mm`;

  return (
    <div className={classNames(styles['preview-area'], { [styles.mobile]: isMobile })}>
      <div className={styles['preview-info']}>
        <div className={styles['preview-header']}>{dimensionText}</div>
        {legendEntries.length > 0 && (
          <div className={styles['color-legend']}>
            {legendEntries.map((entry) => (
              <div className={styles['legend-entry']} key={entry.color}>
                <span className={styles['legend-swatch']} style={{ backgroundColor: entry.color }} />
                <span>{entry.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles['preview-canvas']} ref={containerRef}>
        <Stage height={stageSize.height} width={stageSize.width}>
          <Layer
            scaleX={viewLayout.scale}
            scaleY={viewLayout.scale}
            x={stageSize.width / 2}
            y={stageSize.height / 2 + viewLayout.offsetY}
          >
            {renderScene(viewMode, colors, viewLayout)}
          </Layer>
        </Stage>

        <div className={styles['view-mode-overlay']}>
          {thumbConfigs.map(({ layout: thumbLayout, mode }) => (
            <Tooltip key={mode} title={mode === 'design' ? t.design_preview : t.exploded_view}>
              <div
                className={classNames(styles['view-mode-btn'], { [styles.active]: viewMode === mode })}
                onClick={() => onViewModeChange(mode)}
              >
                <Stage height={THUMB_SIZE} listening={false} width={THUMB_SIZE}>
                  <Layer scaleX={thumbLayout.scale} scaleY={thumbLayout.scale} x={THUMB_SIZE / 2} y={THUMB_SIZE / 2}>
                    {renderScene(mode, COLORS[mode], thumbLayout)}
                  </Layer>
                </Stage>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
};

Preview.displayName = 'Preview';

export default Preview;
