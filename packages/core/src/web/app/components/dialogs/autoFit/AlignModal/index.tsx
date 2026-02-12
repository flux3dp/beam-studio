import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Modal } from 'antd';
import classNames from 'classnames';
import type Konva from 'konva';
import { Layer, Path, Stage } from 'react-konva';

import constant from '@core/app/actions/beambox/constant';
import { addDialogComponent, isIdExist, popDialogById } from '@core/app/actions/dialog-controller';
import ZoomBlock from '@core/app/components/common/ZoomBlock';
import { getRotationAngle } from '@core/app/svgedit/transform/rotation';
import { getBBox } from '@core/app/svgedit/utils/getBBox';
import useKonvaCanvas from '@core/helpers/hooks/konva/useKonvaCanvas';
import useI18n from '@core/helpers/useI18n';
import type { AutoFitContour } from '@core/interfaces/IAutoFit';

import Controls from './Controls';
import type { ImageDimension } from './dimension';
import styles from './index.module.scss';
import KonvaImage from './KonvaImage';

interface Props {
  contour: AutoFitContour;
  element: SVGElement;
  onApply: (initDimension: ImageDimension, imageDimension: ImageDimension) => void;
  onClose?: () => void;
}

const AlignModal = ({ contour, element, onApply, onClose }: Props): React.JSX.Element => {
  const { auto_fit: t, global: tGlobal } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const imageRef = useRef<Konva.Image>(null);
  // for display konva stage scale
  const [zoomScale, setZoomScale] = useState(1);
  const [isMouseOnImage, setIsMouseOnImage] = useState(false);
  const { dpmm } = constant;

  // Fix stage size when container size changed
  useEffect(() => {
    const observer = new ResizeObserver((elements) => {
      const stage = stageRef.current;

      if (!stage) {
        return;
      }

      elements.forEach(({ contentRect: { height, width } }) => {
        stage.width(width);
        stage.height(height);
        stage.batchDraw();
      });
    });

    observer.observe(containerRef.current!);

    return () => {
      observer.disconnect();
    };
  }, []);

  const zoomToFitContour = useCallback(() => {
    const stage = stageRef.current;

    if (!stage) {
      return;
    }

    let stageWidth = stage.width();
    let stageHeight = stage.height();

    if (!stageWidth || !stageHeight) {
      stageWidth = containerRef.current?.clientWidth || 0;
      stageHeight = containerRef.current?.clientHeight || 0;
    }

    if (!stageWidth || !stageHeight) {
      return;
    }

    const { bbox } = contour;
    const [, , width, height] = bbox;
    const scale = Math.min(stageWidth / width, stageHeight / height) * 0.8;

    stage.position({ x: (stageWidth - width * scale) / 2, y: (stageHeight - height * scale) / 2 });
    stage.scale({ x: scale, y: scale });
    stage.batchDraw();
  }, [contour]);

  useEffect(() => zoomToFitContour(), [zoomToFitContour]);

  const { handleWheel, handleZoom, isDragging } = useKonvaCanvas(stageRef, {
    onScaleChanged: setZoomScale,
  });

  const { elemAngle, elemBBox } = useMemo(() => {
    const bbox = getBBox(element as SVGElement);
    const angle = getRotationAngle(element);

    return { elemAngle: angle, elemBBox: bbox };
  }, [element]);
  const initDimension = useMemo(() => {
    const { bbox, center } = contour;
    const [centerX, centerY] = center;
    const [bboxX, bboxY, contourWidth, countourHeight] = bbox;
    // konva dimension, origin at top-left of bbox
    const konvaCx = centerX - bboxX;
    const konvaCy = centerY - bboxY;
    const { height: elemH, width: elemW } = elemBBox;
    const scale = Math.min(contourWidth / elemW, countourHeight / elemH) * 0.8;
    const width = elemW * scale;
    const height = elemH * scale;
    const rad = (elemAngle * Math.PI) / 180;
    const x = konvaCx - (width / 2) * Math.cos(rad) + (height / 2) * Math.sin(rad);
    const y = konvaCy - (height / 2) * Math.cos(rad) - (width / 2) * Math.sin(rad);

    return { height, rotation: elemAngle, width, x, y };
  }, [contour, elemBBox, elemAngle]);
  // recording image dimension of konva
  const [imageDimension, setImageDimension] = useState(initDimension);

  useEffect(() => setImageDimension(initDimension), [initDimension]);

  // background contour path
  const pathD = useMemo(() => {
    const { bbox, contour: contourPoints } = contour;

    return contourPoints
      .map(([x, y], k) => {
        const pointStr = `${x - bbox[0]},${y - bbox[1]}`;

        if (k === 0) {
          return `M${pointStr}`;
        }

        if (k === contourPoints.length - 1) {
          return `${pointStr} z`;
        }

        return `${pointStr}`;
      })
      .join(' L');
  }, [contour]);

  const handleApply = () => {
    onApply(initDimension, imageDimension);
    onClose?.();
  };

  return (
    <Modal
      centered
      footer={
        <div className={styles.footer}>
          <Button onClick={onClose}>{tGlobal.back}</Button>
          <Button onClick={handleApply} type="primary">
            {tGlobal.apply}
          </Button>
        </div>
      }
      maskClosable={false}
      onCancel={onClose}
      open
      title={t.title}
      width={700}
    >
      <div className={styles.container}>
        <Controls
          contour={contour}
          dimension={imageDimension}
          imageRef={imageRef}
          initDimension={initDimension}
          setDimension={setImageDimension}
        />
        <div
          className={classNames(styles.canvas, {
            [styles.dragging]: isDragging,
            [styles.move]: isMouseOnImage,
          })}
        >
          <div className={styles['konva-container']} ref={containerRef}>
            <Stage draggable={isDragging} onWheel={handleWheel} ref={stageRef}>
              <Layer ref={layerRef}>
                <Path data={pathD} fill="#ffffff" stroke="#9babba" />
                <KonvaImage
                  element={element}
                  elementBBox={elemBBox}
                  initDimension={initDimension}
                  isDragging={isDragging}
                  onChange={(newDimension) => setImageDimension((cur) => ({ ...cur, ...newDimension }))}
                  onMouseEnter={() => setIsMouseOnImage(true)}
                  onMouseLeave={() => setIsMouseOnImage(false)}
                  ref={imageRef}
                />
              </Layer>
            </Stage>
          </div>
          <ZoomBlock
            className={styles.zoom}
            getZoom={() => zoomScale * dpmm}
            resetView={zoomToFitContour}
            setZoom={(val) => handleZoom(val / dpmm)}
          />
        </div>
      </div>
    </Modal>
  );
};

export const showAlignModal = (
  element: SVGElement,
  contour: AutoFitContour,
  onApply: (initDimension: ImageDimension, imageDimension: ImageDimension) => void,
): void => {
  const dialogId = 'auto-fit-align';

  if (!isIdExist(dialogId)) {
    addDialogComponent(
      dialogId,
      <AlignModal contour={contour} element={element} onApply={onApply} onClose={() => popDialogById(dialogId)} />,
    );
  }
};

export default AlignModal;
