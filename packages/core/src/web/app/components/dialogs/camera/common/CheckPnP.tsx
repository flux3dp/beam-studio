import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { Button, Col, Row } from 'antd';

import DraggableModal from '@core/app/widgets/DraggableModal';
import { cameraCalibrationApi } from '@core/helpers/api/camera-calibration';
import useI18n from '@core/helpers/useI18n';
import type { PerspectiveGrid } from '@core/interfaces/FisheyePreview';

import styles from './CheckPnP.module.scss';
import ExposureSlider from './ExposureSlider';
import ImageDisplay from './ImageDisplay';
import Title from './Title';
import type { RenderWrapper } from './types';
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
  params: { d: number[][]; is_fisheye?: boolean; k: number[][] } & (
    | { rvec: number[][]; tvec: number[][] }
    | { rvecs: Record<string, number[][]>; tvecs: Record<string, number[][]> }
  );
  points?: Array<[number, number]>;
  renderWrapper?: RenderWrapper;
  title?: string;
}

const CheckPnP = ({
  cameraOptions,
  dh,
  grid,
  hasNext,
  onBack,
  onClose,
  onNext,
  params,
  points,
  renderWrapper,
  title,
}: Props): ReactNode => {
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
  const { autoExposure, exposureSetting, handleTakePicture, setAutoExposure, setExposureSetting } = useCamera(
    handleImg,
    cameraOptions,
  );
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

  const titleNode = <Title title={title ?? tCali.title_confirm_calibration_result} />;
  const imageDisplayNode = (
    <ImageDisplay
      className={styles.image}
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
  );
  const exposureSlider = (
    <ExposureSlider
      autoExposure={autoExposure}
      exposureSetting={exposureSetting}
      onChanged={handleTakePicture}
      onRetakePicture={handleTakePicture}
      setAutoExposure={setAutoExposure}
      setExposureSetting={setExposureSetting}
    />
  );

  if (renderWrapper) {
    const wrapperButtons = [
      { label: lang.calibration.back, onClick: onBack },
      { label: hasNext ? lang.buttons.next : lang.buttons.done, onClick: onNext, primary: true },
    ];

    const content = <div className={styles.desc}>{lang.calibration.check_pnp_desc}</div>;
    const media = (
      <>
        {imageDisplayNode}
        {exposureSlider}
      </>
    );

    return renderWrapper({ buttons: wrapperButtons, content, media, title: titleNode });
  }

  return (
    <DraggableModal
      closable
      footer={[
        <Button key="back" onClick={onBack}>
          {lang.calibration.back}
        </Button>,
        <Button key="done" onClick={onNext} type="primary">
          {hasNext ? lang.buttons.next : lang.buttons.done}
        </Button>,
      ]}
      maskClosable={false}
      onCancel={() => onClose(false)}
      open
      scrollableContent
      title={titleNode}
      width="80vw"
    >
      <Row gutter={[0, 12]}>
        <Col className={styles.desc} span={24}>
          {lang.calibration.check_pnp_desc}
        </Col>
        <Col span={24}>{imageDisplayNode}</Col>
        <Col span={24}>{exposureSlider}</Col>
      </Row>
    </DraggableModal>
  );
};

export default CheckPnP;
