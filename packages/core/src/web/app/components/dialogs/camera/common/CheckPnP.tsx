import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { Button, Col, Modal, Row } from 'antd';

import { cameraCalibrationApi } from '@core/helpers/api/camera-calibration';
import useI18n from '@core/helpers/useI18n';
import type { PerspectiveGrid } from '@core/interfaces/FisheyePreview';

import styles from './CheckPnP.module.scss';
import ExposureSlider from './ExposureSlider';
import ImageDisplay from './ImageDisplay';
import Title from './Title';
import type { Options } from './useCamera';
import useCamera from './useCamera';

interface Props {
  cameraOptions?: Options;
  dh: number;
  grid: PerspectiveGrid;
  hasNext?: boolean;
  onBack: () => void;
  onClose: (complete?: boolean) => void;
  onNext: () => void;
  params: { d: number[][]; k: number[][] } & (
    | { rvec: number[]; tvec: number[] }
    | { rvecs: Record<string, number[]>; tvecs: Record<string, number[]> }
  );
  points?: Array<[number, number]>;
}

const CheckPnP = ({ cameraOptions, dh, grid, hasNext, onBack, onClose, onNext, params, points }: Props): ReactNode => {
  const lang = useI18n();
  const tCali = lang.calibration;
  const [img, setImg] = useState<null | { blob: Blob; url: string }>(null);
  const groupRef = useRef<SVGGElement>(null);

  useEffect(
    () => () => {
      if (img) URL.revokeObjectURL(img.url);
    },
    [img],
  );

  const handleImg = useCallback(
    async (imgBlob: Blob) => {
      const res = await cameraCalibrationApi.checkPnP(imgBlob, dh, params, grid);

      if (!res.success) return false;

      const { blob } = res;

      setImg({ blob, url: URL.createObjectURL(blob) });

      return true;
    },
    [dh, grid, params],
  );
  const { exposureSetting, handleTakePicture, setExposureSetting } = useCamera(handleImg, cameraOptions);
  const displayPoints = useMemo(() => {
    const dpmm = 5;
    const [x0] = grid.x;
    const [y0] = grid.y;

    return points?.map((point) => {
      const x = (point[0] - x0) * dpmm;
      const y = (point[1] - y0) * dpmm;

      return [x, y];
    });
  }, [points, grid]) as Array<[number, number]>;

  return (
    <Modal
      centered
      closable
      footer={[
        <Button key="back" onClick={onBack}>
          {lang.calibration.recalibrate}
        </Button>,
        <Button key="retry" onClick={() => handleTakePicture()}>
          {lang.calibration.retake}
        </Button>,
        <Button key="done" onClick={onNext} type="primary">
          {hasNext ? lang.buttons.next : lang.buttons.done}
        </Button>,
      ]}
      maskClosable={false}
      onCancel={() => onClose(false)}
      open
      title={<Title title={tCali.camera_calibration} />}
      width="80vw"
    >
      <Row gutter={[16, 12]}>
        <Col className={styles.desc} span={24}>
          {lang.calibration.check_pnp_desc}
        </Col>
        <Col span={24}>
          <ImageDisplay
            img={img}
            onScaleChange={(scale) => {
              const circles = groupRef.current?.querySelectorAll('circle');

              circles?.forEach((circle) => {
                const r = circle.classList.contains(styles.center) ? 1 : 5;

                circle.setAttribute('r', `${r / scale}`);
              });
            }}
            renderContents={(scale) => {
              if (!displayPoints) return null;

              return (
                <g className={styles.group} ref={groupRef}>
                  {displayPoints.map(([x, y], index) => {
                    return (
                      <Fragment key={index}>
                        <circle cx={x} cy={y} r={5 / scale} />
                        <circle className={styles.center} cx={x} cy={y} r={1 / scale} />
                      </Fragment>
                    );
                  })}
                </g>
              );
            }}
            zoomPoints={displayPoints}
          />
        </Col>
        {exposureSetting && (
          <>
            <Col span={16}>
              <ExposureSlider
                exposureSetting={exposureSetting}
                onChanged={handleTakePicture}
                setExposureSetting={setExposureSetting}
              />
            </Col>
            <Col span={8}>
              <div className={styles.value}>{exposureSetting.value}</div>
            </Col>
          </>
        )}
      </Row>
    </Modal>
  );
};

export default CheckPnP;
