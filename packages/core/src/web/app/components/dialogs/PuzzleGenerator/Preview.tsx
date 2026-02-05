import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Tooltip } from 'antd';
import type Konva from 'konva';
import { Group, Image, Layer, Path, Stage } from 'react-konva';
import useImage from 'use-image';

import { useStorageStore } from '@core/app/stores/storageStore';
import useI18n from '@core/helpers/useI18n';

import styles from './index.module.scss';
import { computePuzzleGeometry, LAYER_GAP, type PuzzleGeometry } from './puzzleGeometry';
import { drawShapeClipPath, getShapeMetadata } from './shapeGenerators';
import type { PuzzleState, PuzzleTypeConfig } from './types';

const COLORS = {
  design: { border: '#333333', boundary: '#333333', fill: 'transparent', guideLines: '#333333', inner: '#333333' },
  exploded: { border: '#8bc34a', boundary: '#3f51b5', fill: 'transparent', guideLines: '#ffc107', inner: '#f44336' },
} as const;

type ViewMode = keyof typeof COLORS;

interface PreviewProps {
  dimensions: { height: number; width: number };
  onViewModeChange: (mode: ViewMode) => void;
  state: PuzzleState;
  typeConfig: PuzzleTypeConfig;
  viewMode: ViewMode;
}

const THUMB_SIZE = 80;
const THUMB_PAD = 8;
/** Extra bottom space reserved for the overlay buttons (button height + gap) */
const OVERLAY_BOTTOM = THUMB_SIZE + 24;

/** Computes scale and offsets for a given view mode at a given container size */
const computeViewLayout = (
  mode: ViewMode,
  containerW: number,
  containerH: number,
  padding: number,
  paddingBottom: number,
  geo: PuzzleGeometry,
  borderEnabled: boolean,
) => {
  const isExploded = mode === 'exploded';

  const totalWidth =
    isExploded && borderEnabled ? geo.frameWidth * 2 + LAYER_GAP : borderEnabled ? geo.frameWidth : geo.layout.width;

  const totalHeight = borderEnabled ? geo.frameHeight : geo.layout.height;

  const availW = containerW - padding * 2;
  const availH = containerH - padding - paddingBottom;
  const scale = Math.min(availW / totalWidth, availH / totalHeight) || 1;

  const showExploded = isExploded && borderEnabled;

  return {
    boardX: showExploded ? totalWidth / 2 - geo.frameWidth / 2 : 0,
    offsetY: (padding - paddingBottom) / 2,
    raisedEdgesX: showExploded ? -totalWidth / 2 + geo.frameWidth / 2 : 0,
    scale,
    showExploded,
  };
};

const Preview = ({ dimensions, onViewModeChange, state, typeConfig, viewMode }: PreviewProps): React.JSX.Element => {
  const { puzzle_generator: t } = useI18n();
  const isInch = useStorageStore((s) => s.isInch);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ height: 300, width: 400 });

  const shapeType = typeConfig.shapeType;
  const meta = getShapeMetadata(shapeType, state);
  const currentColors = COLORS[viewMode];

  // --- 1. Single Geometry Computation (shared data structure) ---
  const geometry = useMemo(() => computePuzzleGeometry(state, shapeType), [state, shapeType]);

  // --- 2. View Configuration (derived from geometry) ---
  const viewConfig = useMemo(
    () =>
      computeViewLayout(
        viewMode,
        stageSize.width,
        stageSize.height,
        40,
        OVERLAY_BOTTOM,
        geometry,
        state.border.enabled,
      ),
    [stageSize, viewMode, geometry, state.border.enabled],
  );

  // --- 3. Stable Clip Function (skipped when shape fills its bounding box) ---
  const clipFunc = useMemo(() => {
    if (meta.fillsBoundingBox) return undefined;

    return (ctx: Konva.Context) => {
      drawShapeClipPath(
        ctx as unknown as CanvasRenderingContext2D,
        shapeType,
        geometry.layout.width,
        geometry.layout.height,
        meta.boundaryCornerRadius,
      );
    };
  }, [meta.fillsBoundingBox, meta.boundaryCornerRadius, shapeType, geometry.layout.width, geometry.layout.height]);

  // --- 3b. Image Overlay ---
  const [konvaImage] = useImage(state.image.enabled && state.image.dataUrl ? state.image.dataUrl : '', 'anonymous');

  /** Computes "center and cover" placement for the image overlay */
  const imageLayout = useMemo(() => {
    if (!konvaImage || !state.image.enabled) return null;

    const { bleed, offsetX, offsetY, zoom } = state.image;
    const { height: puzzleH, width: puzzleW } = geometry.layout;
    const targetW = puzzleW + bleed * 2;
    const targetH = puzzleH + bleed * 2;

    // Cover: scale to fill target area maintaining aspect ratio
    const coverScale = Math.max(targetW / konvaImage.width, targetH / konvaImage.height);
    const scale = coverScale * (zoom / 100);
    const drawW = konvaImage.width * scale;
    const drawH = konvaImage.height * scale;

    return { height: drawH, width: drawW, x: -drawW / 2 + offsetX, y: -drawH / 2 + offsetY };
  }, [konvaImage, state.image, geometry.layout]);

  /** Clip function for the image — expands boundary by bleed amount */
  const imageClipFunc = useMemo(() => {
    const { bleed } = state.image;

    if (bleed > 0) {
      return (ctx: Konva.Context) => {
        drawShapeClipPath(
          ctx as unknown as CanvasRenderingContext2D,
          shapeType,
          geometry.layout.width + bleed * 2,
          geometry.layout.height + bleed * 2,
          meta.boundaryCornerRadius,
        );
      };
    }

    // No bleed: reuse boundary clip (or undefined for shapes that fill their box)
    return clipFunc;
  }, [state.image, clipFunc, shapeType, geometry.layout.width, geometry.layout.height, meta.boundaryCornerRadius]);

  // --- 4. Resize Observer ---
  useEffect(() => {
    if (!containerRef.current) return undefined;

    const observer = new ResizeObserver(([entry]) =>
      setStageSize({ height: entry.contentRect.height, width: entry.contentRect.width }),
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // --- Render Helpers ---
  const renderEdges = (cf: ((ctx: Konva.Context) => void) | undefined, stroke: string, strokeWidth = 0.5) => (
    <Group clipFunc={cf}>
      <Path data={geometry.edges.horizontalEdges} fill="transparent" stroke={stroke} strokeWidth={strokeWidth} />
      <Path data={geometry.edges.verticalEdges} fill="transparent" stroke={stroke} strokeWidth={strokeWidth} />
    </Group>
  );

  const renderImageOverlay = () =>
    konvaImage && imageLayout ? (
      <Group clipFunc={imageClipFunc}>
        <Image
          height={imageLayout.height}
          image={konvaImage}
          width={imageLayout.width}
          x={imageLayout.x}
          y={imageLayout.y}
        />
      </Group>
    ) : null;

  const renderPuzzleStack = (
    cf: ((ctx: Konva.Context) => void) | undefined,
    colors: (typeof COLORS)[keyof typeof COLORS],
    xOffset = 0,
    showImage = false,
  ) => (
    <Group x={xOffset}>
      {showImage && renderImageOverlay()}
      <Path data={geometry.boundaryPath} fill={colors.fill} stroke={colors.boundary} strokeWidth={0.5} />
      {renderEdges(cf, colors.inner)}
    </Group>
  );

  /** Renders puzzle scene content for a given mode and colors */
  const renderScene = (
    mode: 'design' | 'exploded',
    colors: (typeof COLORS)[keyof typeof COLORS],
    cf?: (ctx: Konva.Context) => void,
    layout?: ReturnType<typeof computeViewLayout>,
    withImage = false,
  ) => {
    const vl = layout ?? viewConfig;

    if (mode === 'design') {
      return (
        <Group>
          {geometry.boardBasePath && (
            <Path data={geometry.boardBasePath} fill={colors.fill} stroke={colors.border} strokeWidth={0.5} />
          )}
          {renderPuzzleStack(cf, colors, 0, withImage)}
        </Group>
      );
    }

    return (
      <Group>
        {vl.showExploded ? (
          <Group x={vl.raisedEdgesX}>
            {/* Image renders first (below raised edges) so bleed doesn't cover the frame */}
            {withImage && renderImageOverlay()}
            <Path
              data={geometry.raisedEdgesPath}
              fill={colors.fill}
              fillRule="evenodd"
              stroke={colors.boundary}
              strokeWidth={0.5}
            />
            {renderPuzzleStack(cf, colors, 0, false)}
          </Group>
        ) : (
          renderPuzzleStack(cf, colors, 0, withImage)
        )}
        {vl.showExploded && (
          <Group x={vl.boardX}>
            <Path data={geometry.boardBasePath} fill={colors.fill} stroke={colors.border} strokeWidth={0.5} />
            {state.border.guideLines && renderEdges(cf, colors.guideLines, 0.3)}
          </Group>
        )}
      </Group>
    );
  };

  // --- Thumbnail Config ---
  const thumbConfigs = useMemo(
    () =>
      (['design', 'exploded'] as const).map((mode) => ({
        layout: computeViewLayout(mode, THUMB_SIZE, THUMB_SIZE, THUMB_PAD, THUMB_PAD, geometry, state.border.enabled),
        mode,
      })),
    [geometry, state.border.enabled],
  );

  return (
    <div className={styles['preview-area']}>
      <div className={styles['preview-header']}>
        {isInch
          ? `${(dimensions.width / 25.4).toFixed(2)}in × ${(dimensions.height / 25.4).toFixed(2)}in`
          : `${dimensions.width}mm × ${dimensions.height}mm`}
      </div>
      <div className={styles['preview-canvas']} ref={containerRef}>
        <Stage height={stageSize.height} width={stageSize.width}>
          <Layer
            scaleX={viewConfig.scale}
            scaleY={viewConfig.scale}
            x={stageSize.width / 2}
            y={stageSize.height / 2 + viewConfig.offsetY}
          >
            {renderScene(viewMode, currentColors, clipFunc, undefined, true)}
          </Layer>
        </Stage>
        <div className={styles['view-mode-overlay']}>
          {thumbConfigs.map(({ layout: thumbLayout, mode }) => (
            <Tooltip key={mode} title={mode === 'design' ? t.design_preview : t.exploded_view}>
              <div
                className={`${styles['view-mode-btn']} ${viewMode === mode ? styles.active : ''}`}
                onClick={() => onViewModeChange(mode)}
              >
                <Stage height={THUMB_SIZE} listening={false} width={THUMB_SIZE}>
                  <Layer scaleX={thumbLayout.scale} scaleY={thumbLayout.scale} x={THUMB_SIZE / 2} y={THUMB_SIZE / 2}>
                    {renderScene(mode, COLORS[mode], clipFunc, thumbLayout, true)}
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

export default Preview;
