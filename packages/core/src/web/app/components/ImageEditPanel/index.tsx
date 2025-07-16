import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Flex } from 'antd';
import type Konva from 'konva';
import { Layer, Line, Stage } from 'react-konva';
import { match } from 'ts-pattern';

import progressCaller from '@core/app/actions/progress-caller';
import FullWindowPanel from '@core/app/widgets/FullWindowPanel/FullWindowPanel';
import useKonvaCanvas from '@core/helpers/hooks/konva/useKonvaCanvas';
import { useKeyDown } from '@core/helpers/hooks/useKeyDown';
import { useMouseDown } from '@core/helpers/hooks/useMouseDown';
import useNewShortcutsScope from '@core/helpers/hooks/useNewShortcutsScope';
import calculateBase64 from '@core/helpers/image-edit-panel/calculate-base64';
import handleFinish from '@core/helpers/image-edit-panel/handle-finish';
import { preprocessByUrl } from '@core/helpers/image-edit-panel/preprocess';
import shortcuts from '@core/helpers/shortcuts';
import useI18n from '@core/helpers/useI18n';

import type { KonvaImageRef } from './components/KonvaImage';
import KonvaImage from './components/KonvaImage';
import type { Mode } from './components/Sider';
import Sider from './components/Sider';
import TopBar from './components/TopBar';
import styles from './index.module.scss';
import { useImageEditPanelStore } from './store';
import { generateCursorSvg } from './utils/generateCursorSvg';
import { getMagicWandFilter } from './utils/getMagicWandFilter';

interface Props {
  image: SVGImageElement;
  onClose: () => void;
  src: string;
}

const EDITING = 0;
const EXPORTING = 1;

const IMAGE_PADDING = 30;

function ImageEditPanel({ image, onClose, src }: Props): React.JSX.Element {
  const {
    beambox: { photo_edit_panel: langPhoto },
    image_edit_panel: lang,
  } = useI18n();

  const {
    addFilter,
    brushSize,
    cornerRadius,
    currentLine,
    filters,
    lineFinish,
    lineMove,
    lines,
    lineStart,
    redo,
    resetState,
    tolerance,
    undo,
  } = useImageEditPanelStore();

  const { isFullColor, isShading, threshold } = useMemo(
    () => ({
      isFullColor: image.getAttribute('data-fullcolor') === '1',
      isShading: image.getAttribute('data-shading') === 'true',
      threshold: Number.parseInt(image.getAttribute('data-threshold')!, 10),
    }),
    [image],
  );
  const [imageSize, setImageSize] = useState({ height: 0, width: 0 });
  const [mode, setMode] = useState<Mode>('eraser');
  const [displayImage, setDisplayImage] = useState('');
  const [progress, setProgress] = useState(EDITING);
  // only for display percentage, not for calculation
  const [zoomScale, setZoomScale] = useState(1);
  const [operation, setOperation] = useState<'drag' | 'eraser' | 'magicWand' | null>(null);
  const [fitScreenDimension, setFitScreenDimension] = useState({ scale: 1, x: 0, y: 0 });
  const divRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const imageRef = useRef<KonvaImageRef>(null);
  const imageData = useRef<ImageData | null>(null);

  // eslint-disable-next-line hooks/exhaustive-deps
  useEffect(() => () => resetState(), []);

  const { handleWheel, handleZoom, handleZoomByScale, isDragging } = useKonvaCanvas(stageRef as any, {
    onScaleChanged: setZoomScale,
  });

  useKeyDown({
    keyUp: useCallback(() => setOperation(null), []),
    predicate: useCallback(({ key }) => key === ' ', []),
  });

  useMouseDown({
    mouseUp: useCallback(() => setOperation(null), []),
    predicate: useCallback(({ button }) => button === 1, []),
  });

  const cursorStyle = useMemo(() => {
    return match({ isDragging, mode })
      .with({ isDragging: true }, () => ({ cursor: 'grabbing' }))
      .with({ mode: 'eraser' }, () => ({
        cursor: `url('data:image/svg+xml;utf8,${generateCursorSvg(brushSize)}') ${brushSize / 2} ${
          brushSize / 2
        }, auto`,
      }))
      .with({ mode: 'magicWand' }, () => ({ cursor: `url('core-img/image-edit-panel/magic-wand.svg') 7 7, auto` }))
      .otherwise(() => {
        return { cursor: 'default' };
      });
  }, [isDragging, mode, brushSize]);

  const getPointerPositionFromStage = useCallback((stage: Konva.Stage) => {
    const scale = stage.scaleX();
    const { x, y } = stage.getPointerPosition()!;
    const { x: stageX, y: stageY } = stage.position();

    return { x: (x - stageX) / scale, y: (y - stageY) / scale };
  }, []);

  const getImageData = useCallback(async () => {
    if (imageData.current) return imageData.current;

    if (imageRef.current?.isCached()) {
      imageData.current = imageRef.current
        ._getCachedSceneCanvas()
        .context._context.getImageData(0, 0, imageSize.width, imageSize.height);

      return imageData.current!;
    }

    // wait for the image to be loaded, seldom happens but can occur if the image is not cached
    await new Promise((resolve) => setTimeout(resolve, 500));

    return getImageData();
  }, [imageSize]);

  useEffect(() => {
    imageData.current = null;
  }, [imageSize, displayImage]);

  const handleMouseDown = useCallback(
    async ({ evt, target }: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = target.getStage();

      if (isDragging || evt.button !== 0 || !stage) {
        return;
      }

      const scale = stage.scaleX();
      const { x, y } = getPointerPositionFromStage(stage);

      if (mode === 'eraser') {
        setOperation('eraser');
        lineStart({ points: [x, y, x, y], strokeWidth: brushSize / scale });
      } else if (mode === 'magicWand') {
        setOperation('magicWand');

        const data = await getImageData();
        const filter = getMagicWandFilter(data, { tolerance, x, y });

        addFilter(filter);
      }
    },
    [lineStart, addFilter, isDragging, getPointerPositionFromStage, mode, brushSize, tolerance, getImageData],
  );

  const handleMouseMove = useCallback(
    ({ target }: Konva.KonvaEventObject<MouseEvent>) => {
      if (isDragging || operation !== 'eraser') {
        return;
      }

      const { x, y } = getPointerPositionFromStage(target.getStage()!);

      lineMove(x, y);
    },
    [isDragging, getPointerPositionFromStage, operation, lineMove],
  );

  const handleExitDrawing = useCallback(() => {
    setOperation(null);

    if (operation === 'eraser') {
      lineFinish();
    }
  }, [operation, lineFinish]);

  const handleReset = useCallback(() => {
    const stage = stageRef.current!;

    handleZoom(fitScreenDimension.scale);
    stage.position(fitScreenDimension);
  }, [fitScreenDimension, handleZoom]);

  const handleComplete = useCallback(() => {
    progressCaller.openNonstopProgress({ id: 'image-editing', message: langPhoto.processing });

    const stage = stageRef.current!;

    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });

    // add a frame to wait for re-render, otherwise the image might be blank or not updated
    requestAnimationFrame(() => {
      stage.batchDraw();
      requestAnimationFrame(() => setProgress(EXPORTING));
    });
  }, [langPhoto]);

  const updateUrl = useCallback(() => stageRef.current!.toDataURL(imageSize), [imageSize]);

  useEffect(() => {
    const updateImages = async () => {
      const url = updateUrl();
      const display = await calculateBase64(url, isShading, threshold, isFullColor);

      handleFinish(image, url, display);

      progressCaller.popById('image-editing');
      onClose();
    };

    if (progress === EXPORTING && imageRef.current?.isCached()) {
      updateImages();
    }
  }, [image, isFullColor, isShading, onClose, progress, threshold, updateUrl]);

  useEffect(() => {
    const initialize = async () => {
      const { clientHeight, clientWidth } = divRef.current!;
      const {
        blobUrl,
        originalHeight: height,
        originalWidth: width,
      } = await preprocessByUrl(src, { isFullResolution: true });
      const fullColorImage = await calculateBase64(blobUrl, true, 255, true);
      const initScale = Math.min(
        1,
        (clientWidth - IMAGE_PADDING * 2) / width,
        (clientHeight - IMAGE_PADDING * 2) / height,
      );

      const imageX = Math.max(IMAGE_PADDING, (clientWidth - width * initScale) / 2);
      const imageY = Math.max(IMAGE_PADDING, (clientHeight - height * initScale) / 2);

      setFitScreenDimension({ scale: initScale, x: imageX, y: imageY });
      setZoomScale(initScale);

      stageRef.current!.position({ x: imageX, y: imageY });
      stageRef.current!.scale({ x: initScale, y: initScale });

      setImageSize({ height, width });
      setDisplayImage(fullColorImage);

      progressCaller.popById('image-editing-init');
    };

    progressCaller.openNonstopProgress({ id: 'image-editing-init', message: langPhoto.processing });

    setTimeout(initialize, 1000);

    // update stage dimensions according parent div
    const stage = stageRef.current;
    const observer = new ResizeObserver((elements) => {
      if (!stage) {
        return;
      }

      elements.forEach(({ contentRect: { height, width } }) => {
        stage.width(width);
        stage.height(height);
        stage.batchDraw();
      });
    });

    observer.observe(divRef.current!);

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  useNewShortcutsScope();
  useEffect(() => {
    const subscribedShortcuts = [
      shortcuts.on(['Escape'], onClose, { isBlocking: true }),
      shortcuts.on(['Fnkey+z'], undo, { isBlocking: true }),
      shortcuts.on(['Shift+Fnkey+z'], redo, { isBlocking: true }),
      shortcuts.on(['Fnkey-+', 'Fnkey-='], () => handleZoomByScale(1.2), { isBlocking: true, splitKey: '-' }),
      shortcuts.on(['Fnkey+-'], () => handleZoomByScale(0.8), { isBlocking: true }),
    ];

    return () => {
      subscribedShortcuts.forEach((unsubscribe) => unsubscribe());
    };
  }, [undo, redo, handleZoomByScale, onClose]);

  const displayCornerRadius = useMemo(() => {
    const base = Math.min(imageSize.width / 2, imageSize.height / 2);

    return Math.round((cornerRadius / 100) * base);
  }, [cornerRadius, imageSize]);

  return (
    <FullWindowPanel
      mobileTitle={lang.title}
      onClose={onClose}
      renderContents={() => (
        <>
          <Sider
            handleComplete={handleComplete}
            mode={mode}
            onClose={onClose}
            setMode={setMode}
            setOperation={setOperation}
          />
          <Flex className={styles['w-100']} vertical>
            <TopBar handleReset={handleReset} handleZoomByScale={handleZoomByScale} zoomScale={zoomScale} />
            <div className={styles['outer-container']}>
              <div className={styles.container} ref={divRef} style={cursorStyle}>
                <Stage
                  draggable={isDragging}
                  onMouseDown={handleMouseDown}
                  onMouseLeave={handleExitDrawing}
                  onMousemove={handleMouseMove}
                  onMouseup={handleExitDrawing}
                  onWheel={handleWheel}
                  pixelRatio={1}
                  ref={stageRef}
                >
                  <Layer pixelRatio={1} ref={layerRef}>
                    <KonvaImage
                      cornerRadius={displayCornerRadius}
                      filters={filters}
                      ref={imageRef}
                      src={displayImage}
                    />
                    {lines.map((line, i) => (
                      <Line
                        globalCompositeOperation="destination-out"
                        key={`line-${i}`}
                        lineCap="round"
                        lineJoin="round"
                        points={line.points}
                        stroke="#df4b26"
                        strokeWidth={line.strokeWidth}
                        tension={0.5}
                      />
                    ))}
                    {currentLine && (
                      <Line
                        globalCompositeOperation="destination-out"
                        lineCap="round"
                        lineJoin="round"
                        points={currentLine.points}
                        stroke="#df4b26"
                        strokeWidth={currentLine.strokeWidth}
                        tension={0.5}
                      />
                    )}
                  </Layer>
                </Stage>
              </div>
            </div>
          </Flex>
        </>
      )}
      renderMobileContents={() => null}
      renderMobileFixedContent={() => null}
    />
  );
}

const MemorizedImageEditPanel = memo(ImageEditPanel);

export default MemorizedImageEditPanel;
