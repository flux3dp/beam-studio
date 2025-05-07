import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Col, Flex, InputNumber, Modal, Progress, Row } from 'antd';
import classNames from 'classnames';

import alertCaller from '@core/app/actions/alert-caller';
import { solvePnPCalculate, solvePnPFindCorners, updateData } from '@core/helpers/camera-calibration-helper';
import useDidUpdateEffect from '@core/helpers/hooks/useDidUpdateEffect';
import useI18n from '@core/helpers/useI18n';
import type { FisheyeCaliParameters } from '@core/interfaces/FisheyePreview';

import ExposureSlider from './ExposureSlider';
import ImageDisplay from './ImageDisplay';
import styles from './SolvePnP.module.scss';
import { adorPnPPoints } from './solvePnPConstants';
import Title from './Title';
import useCamera from './useCamera';

interface Props {
  cameraIndex?: number;
  dh: number;
  hasNext?: boolean;
  imgSource?: 'usb' | 'wifi';
  initInterestArea?: { height: number; width: number; x: number; y: number };
  onBack: () => void;
  onClose: (complete: boolean) => void;
  onNext: (rvec: number[], tvec: number[], imgPoints: Array<[number, number]>) => void;
  params: FisheyeCaliParameters;
  percent?: number;
  refPoints?: Array<[number, number]>;
  title?: string;
  titleLink?: string;
}

const SolvePnP = ({
  cameraIndex,
  dh,
  hasNext = false,
  imgSource = 'wifi',
  initInterestArea,
  onBack,
  onClose,
  onNext,
  params,
  percent,
  refPoints = adorPnPPoints,
  title,
  titleLink,
}: Props): React.JSX.Element => {
  const [img, setImg] = useState<null | { blob: Blob; success: boolean; url: string }>(null);
  const [points, setPoints] = useState<Array<[number, number]>>([]);
  const [zoomPoints, setZoomPoints] = useState<Array<[number, number]>>([]);
  const [selectedPointIdx, setSelectedPointIdx] = useState<number>(-1);
  const dragStartPos = useRef<null | {
    group: SVGGElement;
    pointIdx: number;
    startX: number;
    startY: number;
    x: number;
    y: number;
  }>(null);
  const hasFoundPoints = useRef<boolean>(false);
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const lang = useI18n();

  useEffect(
    () => () => {
      if (img) URL.revokeObjectURL(img.url);
    },
    [img],
  );

  const handleImg = useCallback(
    async (imgBlob: Blob) => {
      try {
        let interestArea: undefined | { height: number; width: number; x: number; y: number } = undefined;

        const container = imgContainerRef.current;
        const svg = container?.querySelector('svg');
        const image = svg?.querySelector('image')!;

        if (image && hasFoundPoints.current) {
          const scale = svg!.clientWidth / Number(image.getAttribute('width'))!;
          const { clientHeight, clientWidth, scrollLeft, scrollTop } = container!;

          interestArea = {
            height: Math.ceil(clientHeight / scale),
            width: Math.ceil(clientWidth / scale),
            x: Math.round(scrollLeft / scale),
            y: Math.round(scrollTop / scale),
          };
        }

        const res = await solvePnPFindCorners(imgBlob, dh, refPoints, interestArea || initInterestArea);

        if (res.success) {
          const { blob, data, success } = res;

          setImg({ blob, success, url: URL.createObjectURL(blob) });
          setPoints(data.points);
          hasFoundPoints.current = true;

          if (!interestArea) setZoomPoints(data.points);
        } else if (res.success === false) {
          const { data } = res;

          if (data.info === 'NO_DATA') {
            if (params.k && params.d) {
              await updateData(params);

              return await handleImg(imgBlob);
            }

            alertCaller.popUpError({
              message: 'No chessboard data detected, please restart calibration.',
            });
          }

          return false;
        }
      } catch (err) {
        alertCaller.popUpError({ message: err instanceof Error ? err.message : 'Unknown error' });
      }

      return true;
    },
    // omit initInterestArea on purpose
    // eslint-disable-next-line hooks/exhaustive-deps
    [dh, params, refPoints],
  );

  const { exposureSetting, handleTakePicture, setExposureSetting } = useCamera(handleImg, {
    index: cameraIndex,
    source: imgSource,
  });

  useDidUpdateEffect(() => {
    setPoints([]);
    setImg(null);
    setSelectedPointIdx(-1);
    handleTakePicture();
  }, [refPoints, handleTakePicture]);

  const handlePointDragStart = useCallback(
    (idx: number, e: React.MouseEvent<SVGGElement>) => {
      e.stopPropagation();
      setSelectedPointIdx(idx);
      dragStartPos.current = {
        group: e.currentTarget,
        pointIdx: idx,
        startX: points[idx]?.[0],
        startY: points[idx]?.[1],
        x: e.screenX,
        y: e.screenY,
      };
    },
    [points],
  );

  const handleDragMove = useCallback((e: React.MouseEvent<HTMLDivElement>, scale: number) => {
    if (dragStartPos.current) {
      const { group, startX, startY, x, y } = dragStartPos.current;
      const dx = e.screenX - x;
      const dy = e.screenY - y;

      if (group) {
        const newX = startX + dx / scale;
        const newY = startY + dy / scale;

        group.querySelectorAll('circle').forEach((c) => {
          c.setAttribute('cx', newX.toString());
          c.setAttribute('cy', newY.toString());
        });
        group.querySelectorAll('text').forEach((t) => {
          t.setAttribute('x', `${newX + 10 / scale}`);
          t.setAttribute('y', `${newY + 10 / scale}`);
        });
      }

      return true;
    }

    return false;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragStartPos.current) {
      const { group, pointIdx } = dragStartPos.current;

      if (group) {
        const circle = group.querySelector('circle')!;
        const x = Number.parseInt(circle.getAttribute('cx')!, 10);
        const y = Number.parseInt(circle.getAttribute('cy')!, 10);

        setPoints((prev) => prev.map((p, i) => (i === pointIdx ? [x, y] : p)));
      }
    }

    dragStartPos.current = null;
  }, []);

  const handleDone = async () => {
    const res = await solvePnPCalculate(dh, points, refPoints);

    if (res.success) {
      const { rvec, tvec } = res.data;

      onNext(rvec, tvec, points);
    } else {
      alertCaller.popUpError({ message: 'Failed to solvePnP' });
    }
  };

  const positionText = useMemo(
    () =>
      [
        lang.calibration.align_olt,
        lang.calibration.align_ort,
        lang.calibration.align_olb,
        lang.calibration.align_orb,
        lang.calibration.align_ilt,
        lang.calibration.align_irt,
        lang.calibration.align_ilb,
        lang.calibration.align_irb,
      ][selectedPointIdx],
    [lang, selectedPointIdx],
  );

  const onScaleChange = useCallback((scale: number, svg: SVGSVGElement) => {
    const groups = svg.querySelectorAll('g');

    groups.forEach((g) => {
      const text = g.querySelector('text')!;
      const circles = g.querySelectorAll('circle');
      let x: number = 0;
      let y: number = 0;

      circles.forEach((c) => {
        if (c.classList.contains('center')) {
          c.setAttribute('r', `${1 / scale}`);
          x = Number.parseFloat(c.getAttribute('cx')!);
          y = Number.parseFloat(c.getAttribute('cy')!);
        } else {
          c.setAttribute('r', `${5 / scale}`);
        }
      });

      text.setAttribute('font-size', `${12 / scale}`);
      text.setAttribute('x', `${x + 10 / scale}`);
      text.setAttribute('y', `${y + 10 / scale}`);
    });
  }, []);

  return (
    <Modal
      centered
      closable
      footer={[
        <Button className={styles['footer-button']} key="back" onClick={onBack}>
          {lang.buttons.back}
        </Button>,
        <Button className={styles['footer-button']} key="retry" onClick={() => handleTakePicture()}>
          {lang.calibration.retake}
        </Button>,
        <Button
          className={styles['footer-button']}
          disabled={!img?.success}
          key="done"
          onClick={handleDone}
          type="primary"
        >
          {hasNext ? lang.buttons.next : lang.buttons.done}
        </Button>,
      ]}
      maskClosable={false}
      onCancel={() => onClose(false)}
      open
      title={<Title link={titleLink} title={title ?? lang.calibration.camera_calibration} />}
      width="80vw"
    >
      <ol className={styles.steps}>
        <li>{lang.calibration.solve_pnp_step1}</li>
        <li>{lang.calibration.solve_pnp_step2}</li>
        <li>{lang.calibration.solve_pnp_step3}</li>
      </ol>
      {percent !== undefined && <Progress className={styles.progress} percent={percent} />}
      <Row gutter={[16, 12]}>
        <Col span={16}>
          <ImageDisplay
            img={img}
            onDragEnd={handleDragEnd}
            onDragMove={handleDragMove}
            onImgLoad={() => setZoomPoints(points)}
            onScaleChange={onScaleChange}
            ref={imgContainerRef}
            renderContents={(scale) =>
              points.map((p, idx) => (
                <g
                  className={classNames(styles.group, { [styles.selected]: idx === selectedPointIdx })}
                  key={idx}
                  onMouseDown={(e) => handlePointDragStart(idx, e)}
                >
                  <circle cx={p[0]} cy={p[1]} r={5 / scale} />
                  <circle className={classNames('center', styles.center)} cx={p[0]} cy={p[1]} r={1 / scale} />
                  <text className={styles.text} fontSize={12 / scale} x={p[0] + 10 / scale} y={p[1] + 10 / scale}>
                    {idx}
                  </text>
                </g>
              ))
            }
            zoomPoints={zoomPoints}
          />
        </Col>
        <Col span={8}>
          {selectedPointIdx >= 0 && points[selectedPointIdx] && (
            <Flex className={styles.info} justify="space-between" vertical>
              <div>
                <Row align="middle" gutter={[0, 12]}>
                  <Col className={styles['point-id']} span={24}>
                    Point #{selectedPointIdx}
                  </Col>
                  <Col span={24}>{positionText}</Col>
                  <Col span={4}>X</Col>
                  <Col span={20}>
                    <InputNumber<number>
                      onChange={(val) => {
                        if (val) setPoints((prev) => prev.map((p, i) => (i === selectedPointIdx ? [val, p[1]] : p)));
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                      onKeyUp={(e) => e.stopPropagation()}
                      precision={0}
                      step={1}
                      type="number"
                      value={points[selectedPointIdx][0]}
                    />
                  </Col>
                  <Col span={4}>Y</Col>
                  <Col span={20}>
                    <InputNumber<number>
                      onChange={(val) => {
                        if (val) setPoints((prev) => prev.map((p, i) => (i === selectedPointIdx ? [p[0], val] : p)));
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                      onKeyUp={(e) => e.stopPropagation()}
                      precision={0}
                      step={1}
                      type="number"
                      value={points[selectedPointIdx][1]}
                    />
                  </Col>
                </Row>
              </div>
              <img src={`core-img/calibration/solve-pnp-${points.length}-${selectedPointIdx}.jpg`} />
            </Flex>
          )}
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

export default SolvePnP;
