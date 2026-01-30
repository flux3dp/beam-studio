import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Stage } from '@react-three/drei';
import { Button, Modal } from 'antd';
import classNames from 'classnames';
import * as THREE from 'three';

import constant from '@core/app/actions/beambox/constant';
import previewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import curveEngravingModeController from '@core/app/actions/canvas/curveEngravingModeController';
import Canvas from '@core/app/widgets/three/Canvas';
import translateErrorMessage from '@core/helpers/device/curve-measurer/translateError';
import isDev from '@core/helpers/is-dev';
import useI18n from '@core/helpers/useI18n';
import browser from '@core/implementations/browser';

import styles from './CurveEngraving.module.scss';
import getCanvasImage from './getCanvasImage';
import Plane from './Plane';

interface Props {
  onClose: () => void;
}

// TODO: Add unit tests
const CurveEngraving = ({ onClose }: Props): React.JSX.Element => {
  const lang = useI18n();
  const [data, setData] = useState(curveEngravingModeController.data!);
  const [displayData, setDisplayData] = useState(curveEngravingModeController.displayData!);
  const [image, setImage] = useState<string | undefined>();
  const [displayCanvas, setDisplayCanvas] = useState(false);
  const [displayCamera, setDisplayCamera] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isAntdMotionCompleted, setIsAntdMotionCompleted] = useState(false);
  const [doSubdivision, setDoSubdivision] = useState(false);
  const isDevMode = useMemo(() => isDev(), []);

  useEffect(() => {
    setTimeout(() => {
      setIsAntdMotionCompleted(true);
      // 0.3s according to antd global config motionDurationSlow
    }, 500);
  }, []);

  const canvasImagePromise = useMemo(async () => {
    const { height, minX: x, minY: y, width } = displayData;
    const { dpmm } = constant;
    const res = await getCanvasImage(x * dpmm, y * dpmm, width * dpmm, height * dpmm);

    return res;
  }, [displayData]);

  const cameraImagePromise = useMemo(async () => {
    const { height, minX: x, minY: y, width } = displayData;
    const { dpmm } = constant;
    const canvasUrl = await previewModeBackgroundDrawer.getCameraCanvasUrl();

    if (!canvasUrl) {
      return null;
    }

    const i = new Image();

    await new Promise((resolve) => {
      i.onload = resolve;
      i.src = canvasUrl;
    });

    const imageBitmap = await createImageBitmap(i, x * dpmm, y * dpmm, width * dpmm, height * dpmm);

    return imageBitmap;
  }, [displayData]);

  const updateImage = useCallback(async () => {
    if (!displayCamera && !displayCanvas) {
      return setImage(undefined);
    }

    const { dpmm } = constant;
    const { height, width } = displayData;
    const outCanvas = document.createElement('canvas');

    outCanvas.width = Math.round(width * dpmm);
    outCanvas.height = Math.round(height * dpmm);

    const ctx = outCanvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);

      if (displayCamera) {
        const cameraImage = await cameraImagePromise;

        if (cameraImage) {
          ctx.drawImage(cameraImage, 0, 0);
        }
      }

      if (displayCanvas) {
        const canvasImage = await canvasImagePromise;

        ctx.drawImage(canvasImage, 0, 0);
      }
    }

    const base64 = outCanvas.toDataURL('image/jpeg', 1);

    return setImage(base64);
  }, [displayData, displayCanvas, displayCamera, canvasImagePromise, cameraImagePromise]);

  useEffect(() => {
    updateImage();
  }, [updateImage, displayCanvas, displayCamera]);

  const toggleSelectIdx = (idx: number) => {
    if (selectedIndices.has(idx)) {
      selectedIndices.delete(idx);
    } else {
      selectedIndices.add(idx);
    }

    setSelectedIndices(new Set(selectedIndices));
  };

  const handleRemeasure = useCallback(async () => {
    const indices = Array.from(selectedIndices).sort((a, b) => a - b);
    const res = await curveEngravingModeController.remeasurePoints(indices);

    if (res) {
      setData(curveEngravingModeController.data!);
      setDisplayData(curveEngravingModeController.displayData!);
      setSelectedIndices(new Set());
    }
  }, [selectedIndices]);

  const measureError = useMemo(() => {
    if (selectedIndices.size === 1) {
      const err = data.errors.flat()[Array.from(selectedIndices)[0]];

      if (err) return translateErrorMessage(err);
    }

    return null;
  }, [data, selectedIndices]);

  return (
    <Modal
      centered
      footer={[
        <Button disabled={selectedIndices.size === 0} key="remeasure" onClick={handleRemeasure}>
          {lang.curve_engraving.remeasure}
        </Button>,
        <Button key="close" onClick={onClose} type="primary">
          {lang.buttons.done}
        </Button>,
      ]}
      maskClosable={false}
      onCancel={onClose}
      open
      title={lang.curve_engraving.preview_3d_curve}
      width={540}
    >
      <div className={classNames(styles['err-container'], { [styles.gray]: isAntdMotionCompleted })}>
        {measureError && (
          <>
            <div className={styles.err}>{measureError.message}</div>
            {measureError.link && (
              <Button
                className={styles.info}
                color="default"
                onClick={() => browser.open(measureError.link!)}
                variant="link"
              >
                <QuestionCircleOutlined className={styles.link} />
              </Button>
            )}
          </>
        )}
      </div>
      <div className={styles.container}>
        {isAntdMotionCompleted && (
          <Canvas
            camera={{
              far: 1000,
              fov: 55,
              near: 0.1,
              position: [0, 0, Math.max(displayData.width, displayData.height)],
            }}
            gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
            linear
          >
            <Stage adjustCamera={1} environment={null} shadows={false}>
              <Suspense fallback={null}>
                <Plane
                  data={data}
                  displayData={displayData}
                  doSubdivision={doSubdivision}
                  selectedIndices={selectedIndices}
                  textureSource={image}
                  toggleSelectedIndex={toggleSelectIdx}
                />
              </Suspense>
            </Stage>
          </Canvas>
        )}
      </div>
      <div className={styles.buttons}>
        <Button
          ghost={displayCanvas}
          onClick={() => setDisplayCanvas((cur) => !cur)}
          shape="round"
          type={displayCanvas ? 'primary' : 'default'}
        >
          {lang.curve_engraving.apply_arkwork}
        </Button>
        <Button
          ghost={displayCamera}
          onClick={() => setDisplayCamera((cur) => !cur)}
          shape="round"
          type={displayCamera ? 'primary' : 'default'}
        >
          {lang.curve_engraving.apply_camera}
        </Button>
        {isDevMode && (
          <Button
            ghost={doSubdivision}
            onClick={() => setDoSubdivision((cur) => !cur)}
            shape="round"
            type={doSubdivision ? 'primary' : 'default'}
          >
            subdivide
          </Button>
        )}
      </div>
      <div className={styles.hint}>{lang.curve_engraving.click_to_select_point}</div>
    </Modal>
  );
};

export default CurveEngraving;
