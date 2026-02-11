import React, { useMemo } from 'react';

import { Tooltip } from 'antd';
import classNames from 'classnames';
import { Layer, Stage } from 'react-konva';
import useImage from 'use-image';

import { useStorageStore } from '@core/app/stores/storageStore';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import { COLORS, MM_PER_INCH, OVERLAY_BOTTOM, STAGE_PADDING, THUMB_PAD, THUMB_SIZE } from '../../constants';
import type { ViewMode } from '../../constants';
import { computePuzzleGeometry, getShapeMetadata } from '../../geometry';
import useClipFunctions from '../../hooks/useClipFunctions';
import useContainerSize from '../../hooks/useContainerSize';
import useImageLayout from '../../hooks/useImageLayout';
import type { PuzzleState, PuzzleTypeConfig } from '../../types';

import computeViewLayout from './computeViewLayout';
import DesignScene from './DesignScene';
import ExplodedScene from './ExplodedScene';
import ImageOverlay from './ImageOverlay';
import styles from './Preview.module.scss';

interface PreviewProps {
  dimensions: { height: number; width: number };
  onViewModeChange: (mode: ViewMode) => void;
  state: PuzzleState;
  typeConfig: PuzzleTypeConfig;
  viewMode: ViewMode;
}

const Preview = ({ dimensions, onViewModeChange, state, typeConfig, viewMode }: PreviewProps): React.JSX.Element => {
  const { puzzle_generator: t } = useI18n();
  const isMobile = useIsMobile();
  const isInch = useStorageStore((s) => s.isInch);
  const { containerRef, size: stageSize } = useContainerSize();

  const shapeType = typeConfig.id;
  const meta = useMemo(() => getShapeMetadata(shapeType, state), [shapeType, state]);
  const colors = COLORS[viewMode];

  // Core data
  const geometry = useMemo(() => computePuzzleGeometry(state, shapeType), [state, shapeType]);
  const { boundaryClip, imageClip } = useClipFunctions(shapeType, geometry, meta, state.image.bleed);

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

  const [konvaImage] = useImage(state.image.enabled && state.image.dataUrl ? state.image.dataUrl : '', 'anonymous');
  const imageLayout = useImageLayout(konvaImage, state.image, geometry.layout);

  const imageOverlayNode =
    konvaImage && imageLayout ? (
      <ImageOverlay clipFunc={imageClip} image={konvaImage} layout={imageLayout} />
    ) : undefined;

  // Scene renderer (design vs exploded)
  const renderScene = (mode: ViewMode, sceneColors: typeof colors, layout: typeof viewLayout) =>
    mode === 'design' ? (
      <DesignScene
        borderEnabled={state.border.enabled}
        clipFunc={boundaryClip}
        colors={sceneColors}
        geometry={geometry}
        imageOverlay={imageOverlayNode}
      />
    ) : (
      <ExplodedScene
        borderEnabled={state.border.enabled}
        clipFunc={boundaryClip}
        colors={sceneColors}
        geometry={geometry}
        guideLines={state.border.guideLines}
        imageOverlay={imageOverlayNode}
        layout={layout}
      />
    );

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

    const entries: Array<{ color: string; label: string }> = [];

    // Raised Edges only shown when border is enabled (separate frame layer)
    if (state.border.enabled) {
      entries.push({ color: COLORS.exploded.raisedEdges, label: t.raised_edges });
    }

    // Puzzle Pieces always shown
    entries.push({ color: COLORS.exploded.pieces, label: t.puzzle_pieces });

    // Board Base only when border is enabled
    if (state.border.enabled) {
      entries.push({ color: COLORS.exploded.boardBase, label: t.board_base });
    }

    if (state.border.guideLines) entries.push({ color: COLORS.exploded.guideLines, label: t.guide_lines });

    return entries;
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
