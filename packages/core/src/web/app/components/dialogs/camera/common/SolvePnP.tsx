import classNames from 'classnames';
import React, { SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Row, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import alertCaller from 'app/actions/alert-caller';
import ObjectPanelIcons from 'app/icons/object-panel/ObjectPanelIcons';
import useI18n from 'helpers/useI18n';
import { FisheyeCaliParameters } from 'interfaces/FisheyePreview';
import {
  solvePnPFindCorners,
  solvePnPCalculate,
  updateData,
} from 'helpers/camera-calibration-helper';

import ExposureSlider from './ExposureSlider';
import styles from './SolvePnP.module.scss';
import Title from './Title';
import useCamera from './useCamera';
import { adorPnPPoints } from './solvePnPConstants';

interface Props {
  params: FisheyeCaliParameters;
  dh: number;
  hasNext?: boolean;
  refPoints?: [number, number][];
  imgSource?: 'wifi' | 'usb';
  titleLink?: string;
  onClose: (complete: boolean) => void;
  onNext: (rvec: number[], tvec: number[]) => void;
  onBack: () => void;
}

const SolvePnP = ({
  params,
  dh,
  hasNext = false,
  refPoints = adorPnPPoints,
  imgSource = 'wifi',
  titleLink,
  onClose,
  onNext,
  onBack,
}: Props): JSX.Element => {
  const [img, setImg] = useState<{ blob: Blob; url: string; success: boolean }>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [selectedPointIdx, setSelectedPointIdx] = useState<number>(-1);
  const dragStartPos = useRef<{
    x: number;
    y: number;
    startX: number;
    startY: number;
    pointIdx?: number;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const scaleRef = useRef<number>(1);
  const imageSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const zoomDelta = useRef<number>(0);
  const zoomProcess = useRef<NodeJS.Timeout>(null);
  const zoomCenter = useRef<{ x: number; y: number }>(null);
  const lang = useI18n();

  useEffect(
    () => () => {
      URL.revokeObjectURL(img?.url);
    },
    [img]
  );

  const scrollToZoomCenter = useCallback(() => {
    if (zoomCenter.current && imgContainerRef.current) {
      const { x, y } = zoomCenter.current;
      imgContainerRef.current.scrollLeft =
        x * scaleRef.current - imgContainerRef.current.clientWidth / 2;
      imgContainerRef.current.scrollTop =
        y * scaleRef.current - imgContainerRef.current.clientHeight / 2;
    }
  }, []);

  const updateScale = useCallback(
    (newValue, scrollToCenter = false) => {
      if (scrollToCenter && imgContainerRef.current) {
        const currentCenter = {
          x: imgContainerRef.current.scrollLeft + imgContainerRef.current.clientWidth / 2,
          y: imgContainerRef.current.scrollTop + imgContainerRef.current.clientHeight / 2,
        };
        zoomCenter.current = {
          x: currentCenter.x / scaleRef.current,
          y: currentCenter.y / scaleRef.current,
        };
      }
      scaleRef.current = newValue;
      if (svgRef.current) {
        svgRef.current.style.width = `${imageSizeRef.current.width * newValue}px`;
        svgRef.current.style.height = `${imageSizeRef.current.height * newValue}px`;
        const circles = svgRef.current.querySelectorAll('circle');
        circles.forEach((c) => {
          if (c.classList.contains('center')) {
            c.setAttribute('r', `${1 / newValue}`);
          } else {
            c.setAttribute('r', `${5 / newValue}`);
          }
        });
        if (scrollToCenter) scrollToZoomCenter();
      }
    },
    [scrollToZoomCenter]
  );

  const zoomToAllPoints = useCallback(
    (targetPoints: [number, number][]) => {
      if (!imgContainerRef.current || !targetPoints?.length) return;
      const coord = targetPoints.reduce(
        (acc, p) => {
          acc.maxX = Math.max(acc.maxX, p[0]);
          acc.maxY = Math.max(acc.maxY, p[1]);
          acc.minX = Math.min(acc.minX, p[0]);
          acc.minY = Math.min(acc.minY, p[1]);
          return acc;
        },
        { maxX: 0, maxY: 0, minX: Infinity, minY: Infinity }
      );
      const width = coord.maxX - coord.minX;
      const height = coord.maxY - coord.minY;
      const center = [(coord.maxX + coord.minX) / 2, (coord.maxY + coord.minY) / 2];
      const scaleW = imgContainerRef.current.clientWidth / width;
      const scaleH = imgContainerRef.current.clientHeight / height;
      const targetScale = Math.min(scaleW, scaleH) * 0.8;
      updateScale(targetScale);
      imgContainerRef.current.scrollLeft =
        center[0] * targetScale - imgContainerRef.current.clientWidth / 2;
      imgContainerRef.current.scrollTop =
        center[1] * targetScale - imgContainerRef.current.clientHeight / 2;
    },
    [updateScale]
  );

  const handleImg = useCallback(
    async (imgBlob: Blob) => {
      try {
        let interestArea: { x: number; y: number; width: number; height: number };
        if (svgRef.current) {
          const { scrollLeft, scrollTop, clientWidth, clientHeight } = imgContainerRef.current;
          const scale = scaleRef.current;
          interestArea = {
            x: Math.round(scrollLeft / scale),
            y: Math.round(scrollTop / scale),
            width: Math.ceil(clientWidth / scale),
            height: Math.ceil(clientHeight / scale),
          };
        }
        const res = await solvePnPFindCorners(imgBlob, dh, refPoints, interestArea);
        if (res.success) {
          const { success, blob, data } = res;
          setImg({ blob, url: URL.createObjectURL(blob), success });
          setPoints(data.points);
          if (!interestArea) zoomToAllPoints(data.points);
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
        alertCaller.popUpError({ message: err.message });
      }
      return true;
    },
    [dh, params, refPoints, zoomToAllPoints]
  );

  const { exposureSetting, setExposureSetting, handleTakePicture } = useCamera(
    handleImg,
    imgSource
  );

  const handleContainerDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    dragStartPos.current = {
      x: e.screenX,
      y: e.screenY,
      startX: e.currentTarget.scrollLeft,
      startY: e.currentTarget.scrollTop,
    };
  }, []);

  const handlePointDragStart = useCallback(
    (idx: number, e: React.MouseEvent<SVGCircleElement>) => {
      e.stopPropagation();
      setSelectedPointIdx(idx);
      dragStartPos.current = {
        x: e.screenX,
        y: e.screenY,
        startX: points[idx]?.[0],
        startY: points[idx]?.[1],
        pointIdx: idx,
      };
    },
    [points]
  );

  const handleDragMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (dragStartPos.current) {
      const { x, y, startX, startY, pointIdx } = dragStartPos.current;
      const dx = e.screenX - x;
      const dy = e.screenY - y;
      if (pointIdx !== undefined) {
        imgContainerRef.current
          .querySelectorAll('svg > g')
          [pointIdx]?.querySelectorAll('circle')
          .forEach((c) => {
            c.setAttribute('cx', `${startX + dx / scaleRef.current}`);
            c.setAttribute('cy', `${startY + dy / scaleRef.current}`);
          });
      } else {
        e.currentTarget.scrollLeft = startX - dx;
        e.currentTarget.scrollTop = startY - dy;
      }
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragStartPos.current) {
      const { pointIdx } = dragStartPos.current;
      if (pointIdx !== undefined) {
        const circle = imgContainerRef.current
          .querySelectorAll('svg > g')
          [pointIdx].querySelector('circle');
        const x = parseInt(circle.getAttribute('cx'), 10);
        const y = parseInt(circle.getAttribute('cy'), 10);
        setPoints((prev) => prev.map((p, i) => (i === pointIdx ? [x, y] : p)));
      }
    }
    dragStartPos.current = null;
  }, []);

  const handleZoom = useCallback(
    (delta) => {
      const cur = scaleRef.current;
      const newScale = Math.round(Math.max(Math.min(2, cur + delta), 0.2) * 100) / 100;
      if (newScale === cur) return;
      updateScale(newScale, true);
    },
    [updateScale]
  );

  const handleImgLoad = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      imageSizeRef.current = {
        width: e.currentTarget.naturalWidth,
        height: e.currentTarget.naturalHeight,
      };
      setImgLoaded(true);
      zoomToAllPoints(points);
    },
    [zoomToAllPoints, points]
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // @ts-expect-error use wheelDelta if exists
      const { deltaY, wheelDelta, detail, ctrlKey } = e;
      const delta = wheelDelta ?? -detail ?? 0;
      if (Math.abs(deltaY) >= 40) {
        // mouse
        e.preventDefault();
        e.stopPropagation();
      } else if (!ctrlKey) return;
      zoomDelta.current += delta / 12000;
      if (!zoomProcess.current) {
        zoomProcess.current = setTimeout(() => {
          if (zoomDelta.current !== 0) handleZoom(zoomDelta.current);
          zoomDelta.current = 0;
          zoomProcess.current = null;
        }, 20);
      }
    },
    [handleZoom]
  );
  useEffect(() => {
    const imgContainer = imgContainerRef.current;
    imgContainer?.addEventListener('wheel', handleWheel);
    return () => {
      imgContainer?.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  const handleDone = async () => {
    const res = await solvePnPCalculate(dh, points, refPoints);
    if (res.success) {
      const { rvec, tvec } = res.data;
      onNext(rvec, tvec);
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
    [lang, selectedPointIdx]
  );

  return (
    <Modal
      width="80vw"
      open
      centered
      onCancel={() => onClose(false)}
      title={<Title title={lang.calibration.camera_calibration} link={titleLink} />}
      footer={[
        <Button className={styles['footer-button']} onClick={onBack} key="back">
          {lang.buttons.back}
        </Button>,
        <Button className={styles['footer-button']} onClick={() => handleTakePicture()} key="retry">
          {lang.calibration.retake}
        </Button>,
        <Button
          className={styles['footer-button']}
          onClick={handleDone}
          disabled={!img?.success}
          key="done"
          type="primary"
        >
          {hasNext ? lang.buttons.next : lang.buttons.done}
        </Button>,
      ]}
      closable
      maskClosable={false}
    >
      <ol className={styles.steps}>
        <li>{lang.calibration.solve_pnp_step1}</li>
        <li>{lang.calibration.solve_pnp_step2}</li>
        <li>{lang.calibration.solve_pnp_step3}</li>
      </ol>
      <Row gutter={[16, 12]}>
        <Col span={16}>
          <div className={styles.container}>
            <div
              ref={imgContainerRef}
              className={styles['img-container']}
              onMouseDown={handleContainerDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
            >
              {!img && (
                <Spin
                  className={styles.spin}
                  indicator={<LoadingOutlined className={styles.spinner} spin />}
                />
              )}
              {img &&
                (!imgLoaded ? (
                  <img src={img?.url} onLoad={handleImgLoad} />
                ) : (
                  <svg
                    ref={svgRef}
                    width={imageSizeRef.current.width * scaleRef.current}
                    height={imageSizeRef.current.height * scaleRef.current}
                    viewBox={`0 0 ${imageSizeRef.current.width} ${imageSizeRef.current.height}`}
                  >
                    <image
                      width={imageSizeRef.current.width}
                      height={imageSizeRef.current.height}
                      href={img?.url}
                    />
                    {points.map((p, idx) => (
                      <g
                        // eslint-disable-next-line react/no-array-index-key
                        key={idx}
                        className={classNames({ [styles.selected]: idx === selectedPointIdx })}
                      >
                        <circle
                          cx={p[0]}
                          cy={p[1]}
                          r={5 / scaleRef.current}
                          onMouseDown={(e) => handlePointDragStart(idx, e)}
                        />
                        <circle
                          className={classNames('center', styles.center)}
                          cx={p[0]}
                          cy={p[1]}
                          r={1 / scaleRef.current}
                        />
                      </g>
                    ))}
                  </svg>
                ))}
            </div>
            <div className={styles['zoom-block']}>
              <button type="button" onClick={() => handleZoom(-0.2)}>
                <ObjectPanelIcons.Minus width="20" height="20" />
              </button>
              <button type="button" onClick={() => handleZoom(0.2)}>
                <ObjectPanelIcons.Plus width="20" height="20" />
              </button>
            </div>
          </div>
        </Col>
        <Col span={8}>
          {selectedPointIdx >= 0 && points[selectedPointIdx] && (
            <Row gutter={[0, 12]} align="middle">
              <Col span={24} className={styles['point-id']}>
                Point #{selectedPointIdx}
              </Col>
              <Col span={24}>{positionText}</Col>
              <Col span={4}>X</Col>
              <Col span={20}>
                <InputNumber<number>
                  type="number"
                  value={points[selectedPointIdx][0]}
                  onChange={(val) =>
                    setPoints((prev) =>
                      prev.map((p, i) => (i === selectedPointIdx ? [val, p[1]] : p))
                    )
                  }
                  step={1}
                  precision={0}
                  onKeyUp={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </Col>
              <Col span={4}>Y</Col>
              <Col span={20}>
                <InputNumber<number>
                  type="number"
                  value={points[selectedPointIdx][1]}
                  onChange={(val) =>
                    setPoints((prev) =>
                      prev.map((p, i) => (i === selectedPointIdx ? [p[0], val] : p))
                    )
                  }
                  step={1}
                  precision={0}
                  onKeyUp={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </Col>
            </Row>
          )}
        </Col>
        {exposureSetting && (
          <>
            <Col span={16}>
              <ExposureSlider
                exposureSetting={exposureSetting}
                setExposureSetting={setExposureSetting}
                onChanged={handleTakePicture}
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
