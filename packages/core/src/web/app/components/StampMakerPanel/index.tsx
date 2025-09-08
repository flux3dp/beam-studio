import type { MutableRefObject } from 'react';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Flex } from 'antd';
import type Konva from 'konva';
import { Layer, Stage } from 'react-konva';

import progressCaller from '@core/app/actions/progress-caller';
import FullWindowPanel from '@core/app/widgets/FullWindowPanel/FullWindowPanel';
import useKonvaCanvas from '@core/helpers/hooks/konva/useKonvaCanvas';
import useNewShortcutsScope from '@core/helpers/hooks/useNewShortcutsScope';
import calculateBase64 from '@core/helpers/image-edit-panel/calculate-base64';
import handleFinish from '@core/helpers/image-edit-panel/handle-finish';
import { preprocessByUrl } from '@core/helpers/image-edit-panel/preprocess';
import shortcuts from '@core/helpers/shortcuts';
import useI18n from '@core/helpers/useI18n';

import type { KonvaImageRef } from './components/KonvaImage';
import KonvaImage from './components/KonvaImage';
import Sider from './components/Sider';
import TopBar from './components/TopBar';
import styles from './index.module.scss';
import { useStampMakerPanelStore } from './store';

interface Props {
  image: SVGImageElement;
  onClose: () => void;
  src: string;
}

const EDITING = 0;
const EXPORTING = 1;
const IMAGE_PADDING = 30;

function UnmemorizedStampMakerPanel({ image, onClose, src }: Props): React.JSX.Element {
  const {
    beambox: { photo_edit_panel: langPhoto },
    stamp_maker_panel: lang,
  } = useI18n();
  const { filters, horizontalFlip, lastBevelRadiusFilter, redo, resetState, undo } = useStampMakerPanelStore();
  const { isShading, threshold } = useMemo(
    () => ({
      isShading: image.getAttribute('data-shading') === 'true',
      threshold: Number.parseInt(image.getAttribute('data-threshold')! || '128', 10),
    }),
    [image],
  );
  const [imageSize, setImageSize] = useState({ height: 0, width: 0 });
  const [displayImage, setDisplayImage] = useState('');
  const [progress, setProgress] = useState(EDITING);
  // only for display percentage, not for calculation
  const [zoomScale, setZoomScale] = useState(1);
  const [fitScreenDimension, setFitScreenDimension] = useState({ scale: 1, x: 0, y: 0 });
  const divRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const imageRef = useRef<KonvaImageRef>(null);
  const { handleWheel, handleZoom, handleZoomByScale, isDragging } = useKonvaCanvas(
    stageRef as MutableRefObject<Konva.Stage>,
    { onScaleChanged: setZoomScale },
  );

  const handleResetZoom = useCallback(() => {
    const stage = stageRef.current!;

    handleZoom(fitScreenDimension.scale);
    stage.position(fitScreenDimension);
  }, [fitScreenDimension, handleZoom]);

  const handleComplete = useCallback(() => {
    progressCaller.openNonstopProgress({ id: 'stamp-maker', message: langPhoto.processing });

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
      const display = await calculateBase64(url, true, threshold, true);
      // change to shading with pwm when image has bevels
      const changes: Record<string, number | string> | {} = lastBevelRadiusFilter
        ? { 'data-pwm': 1, 'data-shading': 'true' }
        : {};

      handleFinish(image, url, display, changes);

      progressCaller.popById('stamp-maker');
      onClose();
    };

    if (progress === EXPORTING && imageRef.current?.isCached()) {
      updateImages();
    }
  }, [image, isShading, lastBevelRadiusFilter, onClose, progress, threshold, updateUrl]);

  useEffect(() => {
    const initialize = async () => {
      const { clientHeight, clientWidth } = divRef.current!;
      const {
        blobUrl,
        originalHeight: height,
        originalWidth: width,
      } = await preprocessByUrl(src, { isFullResolution: true });
      const originalImage = await calculateBase64(blobUrl, isShading, threshold, false);
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
      setDisplayImage(originalImage);

      progressCaller.popById('stamp-maker-init');
    };

    progressCaller.openNonstopProgress({ id: 'stamp-maker-init', message: langPhoto.processing });

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
      resetState();
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

  return (
    <FullWindowPanel
      mobileTitle={lang.title}
      onClose={onClose}
      renderContents={() => (
        <>
          <Sider handleComplete={handleComplete} onClose={onClose} />
          <Flex className={styles['w-100']} vertical>
            <TopBar handleReset={handleResetZoom} handleZoomByScale={handleZoomByScale} zoomScale={zoomScale} />
            <div className={styles['outer-container']}>
              <div className={styles.container} ref={divRef}>
                <Stage draggable={isDragging} onWheel={handleWheel} pixelRatio={1} ref={stageRef}>
                  <Layer pixelRatio={1} ref={layerRef}>
                    <KonvaImage filters={filters} horizontalFlip={horizontalFlip} ref={imageRef} src={displayImage} />
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

const StampMakerPanel = memo(UnmemorizedStampMakerPanel);

export default StampMakerPanel;
