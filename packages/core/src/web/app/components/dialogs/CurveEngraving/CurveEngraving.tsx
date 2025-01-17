import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Button, Modal } from 'antd';
import { Stage } from '@react-three/drei';

import Canvas from 'app/widgets/three/Canvas';
import constant from 'app/actions/beambox/constant';
import previewModeBackgroundDrawer from 'app/actions/beambox/preview-mode-background-drawer';
import useI18n from 'helpers/useI18n';
import { addDialogComponent, isIdExist, popDialogById } from 'app/actions/dialog-controller';
import { CurveEngraving as ICurveEngraving } from 'interfaces/ICurveEngraving';

import getCanvasImage from './getCanvasImage';
import Plane from './Plane';
import styles from './CurveEngraving.module.scss';

interface Props {
  data: ICurveEngraving;
  onRemeasure: (indices: Array<number>) => Promise<ICurveEngraving>;
  onClose: () => void;
}

// TODO: Add unit tests
const CurveEngraving = ({ data: initData, onRemeasure, onClose }: Props): JSX.Element => {
  const lang = useI18n();
  const [data, setData] = useState(initData);
  const [image, setImage] = useState<string | undefined>();
  const [displayCanvas, setDisplayCanvas] = useState(false);
  const [displayCamera, setDisplayCamera] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isAntdMotionCompleted, setIsAntdMotionCompleted] = useState(false);
  const { bbox } = data;

  useEffect(() => {
    setTimeout(() => {
      setIsAntdMotionCompleted(true);
      // 0.3s according to antd global config motionDurationSlow
    }, 500);
  }, []);

  const canvasImagePromise = useMemo(async () => {
    const { x, y, width, height } = bbox;
    const { dpmm } = constant;
    const res = await getCanvasImage(x * dpmm, y * dpmm, width * dpmm, height * dpmm);
    return res;
  }, [bbox]);

  const cameraImagePromise = useMemo(async () => {
    const { x, y, width, height } = bbox;
    const { dpmm } = constant;
    const canvasUrl = previewModeBackgroundDrawer.getCameraCanvasUrl();
    if (!canvasUrl) return null;
    const i = new Image();
    await new Promise((resolve) => {
      i.onload = resolve;
      i.src = canvasUrl;
    });
    const imageBitmap = await createImageBitmap(i, x * dpmm, y * dpmm, width * dpmm, height * dpmm);
    return imageBitmap;
  }, [bbox]);

  const updateImage = useCallback(async () => {
    if (!displayCamera && !displayCanvas) return setImage(undefined);
    const { dpmm } = constant;
    const { width, height } = bbox;
    const outCanvas = document.createElement('canvas');
    outCanvas.width = Math.round(width * dpmm);
    outCanvas.height = Math.round(height * dpmm);
    const ctx = outCanvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);
    if (displayCamera) {
      const cameraImage = await cameraImagePromise;
      if (cameraImage) ctx.drawImage(cameraImage, 0, 0);
    }
    if (displayCanvas) {
      const canvasImage = await canvasImagePromise;
      ctx.drawImage(canvasImage, 0, 0);
    }
    const base64 = outCanvas.toDataURL('image/jpeg', 1);
    return setImage(base64);
  }, [bbox, displayCanvas, displayCamera, canvasImagePromise, cameraImagePromise]);

  useEffect(() => {
    updateImage();
  }, [updateImage, displayCanvas, displayCamera]);

  const toggleSelectIdx = (idx: number) => {
    if (selectedIndices.has(idx)) selectedIndices.delete(idx);
    else selectedIndices.add(idx);
    setSelectedIndices(new Set(selectedIndices));
  };

  const handleRemeasure = useCallback(async () => {
    const indices = Array.from(selectedIndices).sort((a, b) => a - b);
    const newData = await onRemeasure(indices);
    if (newData) {
      setData(newData);
      setSelectedIndices(new Set());
    }
  }, [onRemeasure, selectedIndices]);

  return (
    <Modal
      title={lang.curve_engraving.preview_3d_curve}
      open
      centered
      width={540}
      maskClosable={false}
      onCancel={onClose}
      footer={[
        <Button key="remeasure" onClick={handleRemeasure} disabled={selectedIndices.size === 0}>
          {lang.curve_engraving.remeasure}
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          {lang.buttons.done}
        </Button>,
      ]}
    >
      <div className={styles.container}>
        {isAntdMotionCompleted && (
          <Canvas
            camera={{
              fov: 55,
              near: 0.1,
              far: 1000,
              position: [0, 0, Math.max(bbox.width, bbox.height)],
            }}
            gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
            linear
          >
            <Stage adjustCamera={1} shadows={false} environment={null}>
              <Suspense fallback={null}>
                <Plane
                  data={data}
                  textureSource={image}
                  selectedIndices={selectedIndices}
                  toggleSelectedIndex={toggleSelectIdx}
                />
              </Suspense>
            </Stage>
          </Canvas>
        )}
      </div>
      <div className={styles.buttons}>
        <Button
          shape="round"
          ghost={displayCanvas}
          type={displayCanvas ? 'primary' : 'default'}
          onClick={() => setDisplayCanvas((cur) => !cur)}
        >
          {lang.curve_engraving.apply_arkwork}
        </Button>
        <Button
          shape="round"
          ghost={displayCamera}
          type={displayCamera ? 'primary' : 'default'}
          onClick={() => setDisplayCamera((cur) => !cur)}
        >
          {lang.curve_engraving.apply_camera}
        </Button>
      </div>
      <div className={styles.hint}>{lang.curve_engraving.click_to_select_point}</div>
    </Modal>
  );
};

export default CurveEngraving;

export const showCurveEngraving = async (
  data: ICurveEngraving,
  onRemeasure: (indices: Array<number>) => Promise<ICurveEngraving>
): Promise<void> => {
  if (!isIdExist('curve-engraving')) {
    return new Promise<void>((resolve) => {
      addDialogComponent(
        'curve-engraving',
        <CurveEngraving
          data={data}
          onRemeasure={onRemeasure}
          onClose={() => {
            popDialogById('curve-engraving');
            resolve();
          }}
        />
      );
    });
  }
  return Promise.resolve();
};
