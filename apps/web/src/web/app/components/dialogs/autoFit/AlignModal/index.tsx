import classNames from 'classnames';
import Konva from 'konva';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layer, Path, Stage } from 'react-konva';
import { Button, Modal } from 'antd';

import constant from 'app/actions/beambox/constant';
import ISVGCanvas from 'interfaces/ISVGCanvas';
import useKonvaCanvas from 'helpers/hooks/konva/useKonvaCanvas';
import useI18n from 'helpers/useI18n';
import ZoomBlock from 'app/components/beambox/ZoomBlock';
import { AutoFitContour } from 'interfaces/IAutoFit';
import { addDialogComponent, isIdExist, popDialogById } from 'app/actions/dialog-controller';
import { getRotationAngle } from 'app/svgedit/transform/rotation';
import { getSVGAsync } from 'helpers/svg-editor-helper';

import Controls from './Controls';
import KonvaImage from './KonvaImage';
import styles from './index.module.scss';
import { ImageDimension } from './dimension';

let svgCanvas: ISVGCanvas;
getSVGAsync(({ Canvas }) => {
  svgCanvas = Canvas;
});

interface Props {
  contour: AutoFitContour;
  element: SVGElement;
  onApply: (initDimension: ImageDimension, imageDimension: ImageDimension) => void;
  onClose?: () => void;
}

const AlignModal = ({ contour, element, onApply, onClose }: Props): JSX.Element => {
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
      if (!stage) return;

      elements.forEach(({ contentRect: { width, height } }) => {
        stage.width(width);
        stage.height(height);
        stage.batchDraw();
      });
    });
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  const zoomToFitContour = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let stageWidth = stage.width();
    let stageHeight = stage.height();
    if (!stageWidth || !stageHeight) {
      stageWidth = containerRef.current?.clientWidth || 0;
      stageHeight = containerRef.current?.clientHeight || 0;
    }
    if (!stageWidth || !stageHeight) return;
    const { bbox } = contour;
    const [, , width, height] = bbox;
    const scale = Math.min(stageWidth / width, stageHeight / height) * 0.8;
    stage.position({ x: (stageWidth - width * scale) / 2, y: (stageHeight - height * scale) / 2 });
    stage.scale({ x: scale, y: scale });
    stage.batchDraw();
  }, [contour]);
  useEffect(() => zoomToFitContour(), [zoomToFitContour]);

  const { isDragging, handleWheel, handleZoom } = useKonvaCanvas(stageRef, {
    onScaleChanged: setZoomScale,
  });

  const { elemBBox, elemAngle } = useMemo(() => {
    const bbox =
      element.tagName === 'use'
        ? svgCanvas.getSvgRealLocation(element)
        : svgCanvas.calculateTransformedBBox(element);
    const angle = getRotationAngle(element);
    return { elemBBox: bbox, elemAngle: angle };
  }, [element]);
  const initDimension = useMemo(() => {
    const { bbox, center } = contour;
    const [centerX, centerY] = center;
    const [bboxX, bboxY, contourWidth, countourHeight] = bbox;
    // konva dimension, origin at top-left of bbox
    const konvaCx = centerX - bboxX;
    const konvaCy = centerY - bboxY;
    const { width: elemW, height: elemH } = elemBBox;
    const scale = Math.min(contourWidth / elemW, countourHeight / elemH) * 0.8;
    const width = elemW * scale;
    const height = elemH * scale;
    const rad = (elemAngle * Math.PI) / 180;
    const x = konvaCx - (width / 2) * Math.cos(rad) + (height / 2) * Math.sin(rad);
    const y = konvaCy - (height / 2) * Math.cos(rad) - (width / 2) * Math.sin(rad);
    return { x, y, width, height, rotation: elemAngle };
  }, [contour, elemBBox, elemAngle]);
  // recording image dimension of konva
  const [imageDimension, setImageDimension] = useState(initDimension);
  useEffect(() => setImageDimension(initDimension), [initDimension]);

  // background contour path
  const pathD = useMemo(() => {
    const { contour: contourPoints, bbox } = contour;
    return contourPoints
      .map(([x, y], k) => {
        const pointStr = `${x - bbox[0]},${y - bbox[1]}`;
        if (k === 0) return `M${pointStr}`;
        if (k === contourPoints.length - 1) return `${pointStr} z`;
        return `${pointStr}`;
      })
      .join(' L');
  }, [contour]);

  const handleApply = () => {
    onApply(initDimension, imageDimension);
    onClose();
  };

  return (
    <Modal
      width={700}
      open
      centered
      maskClosable={false}
      title={t.title}
      onCancel={onClose}
      footer={
        <div className={styles.footer}>
          <Button onClick={onClose}>{tGlobal.back}</Button>
          <Button type="primary" onClick={handleApply}>
            {tGlobal.apply}
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        <Controls
          contour={contour}
          imageRef={imageRef}
          dimension={imageDimension}
          initDimension={initDimension}
          setDimension={setImageDimension}
        />
        <div
          className={classNames(styles.canvas, {
            [styles.move]: isMouseOnImage,
            [styles.dragging]: isDragging,
          })}
        >
          <div ref={containerRef} className={styles['konva-container']}>
            <Stage ref={stageRef} onWheel={handleWheel} draggable={isDragging}>
              <Layer ref={layerRef}>
                <Path data={pathD} stroke="#9babba" fill="#ffffff" />
                <KonvaImage
                  ref={imageRef}
                  isDragging={isDragging}
                  element={element}
                  elementBBox={elemBBox}
                  initDimension={initDimension}
                  onMouseEnter={() => setIsMouseOnImage(true)}
                  onMouseLeave={() => setIsMouseOnImage(false)}
                  onChange={(newDimension) =>
                    setImageDimension((cur) => ({ ...cur, ...newDimension }))
                  }
                />
              </Layer>
            </Stage>
          </div>
          <ZoomBlock
            className={styles.zoom}
            getZoom={() => zoomScale * dpmm}
            setZoom={(val) => handleZoom(val / dpmm)}
            resetView={zoomToFitContour}
          />
        </div>
      </div>
    </Modal>
  );
};

export const showAlignModal = (
  element: SVGElement,
  contour: AutoFitContour,
  onApply: (initDimension: ImageDimension, imageDimension: ImageDimension) => void
): void => {
  const dialogId = 'auto-fit-align';
  if (!isIdExist(dialogId)) {
    addDialogComponent(
      dialogId,
      <AlignModal
        element={element}
        contour={contour}
        onApply={onApply}
        onClose={() => popDialogById(dialogId)}
      />
    );
  }
};

export default AlignModal;
