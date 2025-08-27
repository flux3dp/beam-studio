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
import { detectBackgroundType } from './store/utils/detectBackgroundType';

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
  const { filters, horizontalFlip, redo, resetState, setBackgroundType, undo } = useStampMakerPanelStore();
  const { isFullColor, isShading, threshold } = useMemo(
    () => ({
      isFullColor: true,
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
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const imageRef = useRef<KonvaImageRef>(null);
  const imageData = useRef<ImageData | null>(null);
  const { handleWheel, handleZoom, handleZoomByScale, isDragging } = useKonvaCanvas(stageRef as any, {
    onScaleChanged: setZoomScale,
  });

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

  const detectAndSetBackgroundType = useCallback(async () => {
    // Wait for image to be loaded and cached
    let retries = 0;
    const maxRetries = 20; // 10 seconds max wait

    while (retries < maxRetries) {
      if (
        imageRef.current?.useImageStatus === 'loaded' &&
        imageRef.current?.isCached() &&
        imageSize.width &&
        imageSize.height
      ) {
        const currentImageData = imageRef.current
          ._getCachedSceneCanvas()
          .context._context.getImageData(0, 0, imageSize.width, imageSize.height);

        const backgroundType = detectBackgroundType(currentImageData);

        console.log('Detected background type:', backgroundType);

        setBackgroundType(backgroundType);

        return;
      }

      console.log(`Waiting for image to be loaded and cached... (attempt ${retries + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, 500));
      retries++;
    }

    console.error('Failed to detect background type: Image not loaded or cached after timeout');
  }, [imageSize, setBackgroundType]);

  const handleResetZoom = useCallback(() => {
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
    imageData.current = null;
  }, [imageSize, displayImage]);

  // Detect background type when display image changes and image is ready
  useEffect(() => {
    if (displayImage && imageSize.width && imageSize.height) {
      detectAndSetBackgroundType();
    }
  }, [displayImage, imageSize, detectAndSetBackgroundType]);

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
      const fullColorImage = await calculateBase64(blobUrl, true, 255, false);
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
