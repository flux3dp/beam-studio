import type { SyntheticEvent } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { LoadingOutlined } from '@ant-design/icons';
import { Button, Col, InputNumber, Modal, Row, Spin } from 'antd';
import classNames from 'classnames';

import alertCaller from '@core/app/actions/alert-caller';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';
import { solvePnPCalculate, solvePnPFindCorners, updateData } from '@core/helpers/camera-calibration-helper';
import useI18n from '@core/helpers/useI18n';
import type { FisheyeCaliParameters } from '@core/interfaces/FisheyePreview';

import ExposureSlider from './ExposureSlider';
import styles from './SolvePnP.module.scss';
import { adorPnPPoints } from './solvePnPConstants';
import Title from './Title';
import useCamera from './useCamera';

interface Props {
  dh: number;
  hasNext?: boolean;
  imgSource?: 'usb' | 'wifi';
  onBack: () => void;
  onClose: (complete: boolean) => void;
  onNext: (rvec: number[], tvec: number[]) => void;
  params: FisheyeCaliParameters;
  refPoints?: Array<[number, number]>;
  titleLink?: string;
}

const SolvePnP = ({
  dh,
  hasNext = false,
  imgSource = 'wifi',
  onBack,
  onClose,
  onNext,
  params,
  refPoints = adorPnPPoints,
  titleLink,
}: Props): React.JSX.Element => {
  const [img, setImg] = useState<null | { blob: Blob; success: boolean; url: string }>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [points, setPoints] = useState<Array<[number, number]>>([]);
  const [selectedPointIdx, setSelectedPointIdx] = useState<number>(-1);
  const dragStartPos = useRef<null | {
    pointIdx?: number;
    startX: number;
    startY: number;
    x: number;
    y: number;
  }>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const scaleRef = useRef<number>(1);
  const imageSizeRef = useRef<{ height: number; width: number }>({ height: 0, width: 0 });
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const zoomDelta = useRef<number>(0);
  const zoomProcess = useRef<NodeJS.Timeout | null>(null);
  const zoomCenter = useRef<null | { x: number; y: number }>(null);
  const lang = useI18n();

  useEffect(
    () => () => {
      if (img) URL.revokeObjectURL(img.url);
    },
    [img],
  );

  const scrollToZoomCenter = useCallback(() => {
    if (zoomCenter.current && imgContainerRef.current) {
      const { x, y } = zoomCenter.current;

      imgContainerRef.current.scrollLeft = x * scaleRef.current - imgContainerRef.current.clientWidth / 2;
      imgContainerRef.current.scrollTop = y * scaleRef.current - imgContainerRef.current.clientHeight / 2;
    }
  }, []);

  const updateScale = useCallback(
    (newValue: number, scrollToCenter = false) => {
      if (scrollToCenter && imgContainerRef.current) {
        const currentCenter = {
          x: imgContainerRef.current.scrollLeft + imgContainerRef.current.clientWidth / 2,
          y: imgContainerRef.current.scrollTop + imgContainerRef.current.clientHeight / 2,
        };

        zoomCenter.current = {
          x: currentCenter.x / scaleRef.current,
          y: currentCenter.y / scaleRef.current,
        } as { x: number; y: number };
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

        if (scrollToCenter) {
          scrollToZoomCenter();
        }
      }
    },
    [scrollToZoomCenter],
  );

  const zoomToAllPoints = useCallback(
    (targetPoints: Array<[number, number]>) => {
      if (!imgContainerRef.current || !targetPoints?.length) {
        return;
      }

      const coord = targetPoints.reduce(
        (acc, p) => {
          acc.maxX = Math.max(acc.maxX, p[0]);
          acc.maxY = Math.max(acc.maxY, p[1]);
          acc.minX = Math.min(acc.minX, p[0]);
          acc.minY = Math.min(acc.minY, p[1]);

          return acc;
        },
        { maxX: 0, maxY: 0, minX: Infinity, minY: Infinity },
      );
      const width = coord.maxX - coord.minX;
      const height = coord.maxY - coord.minY;
      const center = [(coord.maxX + coord.minX) / 2, (coord.maxY + coord.minY) / 2];
      const scaleW = imgContainerRef.current.clientWidth / width;
      const scaleH = imgContainerRef.current.clientHeight / height;
      const targetScale = Math.min(scaleW, scaleH) * 0.8;

      updateScale(targetScale);
      imgContainerRef.current.scrollLeft = center[0] * targetScale - imgContainerRef.current.clientWidth / 2;
      imgContainerRef.current.scrollTop = center[1] * targetScale - imgContainerRef.current.clientHeight / 2;
    },
    [updateScale],
  );

  const handleImg = useCallback(
    async (imgBlob: Blob) => {
      try {
        let interestArea: undefined | { height: number; width: number; x: number; y: number } = undefined;

        if (svgRef.current && imgContainerRef.current) {
          const { clientHeight, clientWidth, scrollLeft, scrollTop } = imgContainerRef.current;
          const scale = scaleRef.current;

          interestArea = {
            height: Math.ceil(clientHeight / scale),
            width: Math.ceil(clientWidth / scale),
            x: Math.round(scrollLeft / scale),
            y: Math.round(scrollTop / scale),
          };
        }

        const res = await solvePnPFindCorners(imgBlob, dh, refPoints, interestArea);

        if (res.success) {
          const { blob, data, success } = res;

          setImg({ blob, success, url: URL.createObjectURL(blob) });
          setPoints(data.points);

          if (!interestArea) {
            zoomToAllPoints(data.points);
          }
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
    [dh, params, refPoints, zoomToAllPoints],
  );

  const { exposureSetting, handleTakePicture, setExposureSetting } = useCamera(handleImg, imgSource);

  const handleContainerDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    dragStartPos.current = {
      startX: e.currentTarget.scrollLeft,
      startY: e.currentTarget.scrollTop,
      x: e.screenX,
      y: e.screenY,
    };
  }, []);

  const handlePointDragStart = useCallback(
    (idx: number, e: React.MouseEvent<SVGCircleElement>) => {
      e.stopPropagation();
      setSelectedPointIdx(idx);
      dragStartPos.current = {
        pointIdx: idx,
        startX: points[idx]?.[0],
        startY: points[idx]?.[1],
        x: e.screenX,
        y: e.screenY,
      };
    },
    [points],
  );

  const handleDragMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (dragStartPos.current) {
      const { pointIdx, startX, startY, x, y } = dragStartPos.current;
      const dx = e.screenX - x;
      const dy = e.screenY - y;

      if (pointIdx !== undefined) {
        imgContainerRef
          .current!.querySelectorAll('svg > g')
          // eslint-disable-next-line no-unexpected-multiline
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
        const circle = imgContainerRef.current!.querySelectorAll('svg > g')[pointIdx].querySelector('circle')!;
        const x = Number.parseInt(circle.getAttribute('cx')!, 10);
        const y = Number.parseInt(circle.getAttribute('cy')!, 10);

        setPoints((prev) => prev.map((p, i) => (i === pointIdx ? [x, y] : p)));
      }
    }

    dragStartPos.current = null;
  }, []);

  const handleZoom = useCallback(
    (delta: number) => {
      const cur = scaleRef.current;
      const newScale = Math.round(Math.max(Math.min(2, cur + delta), 0.2) * 100) / 100;

      if (newScale === cur) {
        return;
      }

      updateScale(newScale, true);
    },
    [updateScale],
  );

  const handleImgLoad = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      imageSizeRef.current = {
        height: e.currentTarget.naturalHeight,
        width: e.currentTarget.naturalWidth,
      };
      setImgLoaded(true);
      zoomToAllPoints(points);
    },
    [zoomToAllPoints, points],
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // @ts-expect-error use wheelDelta if exists
      const { ctrlKey, deltaY, detail, wheelDelta } = e;
      // eslint-disable-next-line no-constant-binary-expression
      const delta = wheelDelta ?? -detail ?? 0;

      if (Math.abs(deltaY) >= 40) {
        // mouse
        e.preventDefault();
        e.stopPropagation();
      } else if (!ctrlKey) {
        return;
      }

      zoomDelta.current += delta / 12000;

      if (!zoomProcess.current) {
        zoomProcess.current = setTimeout(() => {
          if (zoomDelta.current !== 0) {
            handleZoom(zoomDelta.current);
          }

          zoomDelta.current = 0;
          zoomProcess.current = null;
        }, 20) as NodeJS.Timeout;
      }
    },
    [handleZoom],
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
    [lang, selectedPointIdx],
  );

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
      title={<Title link={titleLink} title={lang.calibration.camera_calibration} />}
      width="80vw"
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
              className={styles['img-container']}
              onMouseDown={handleContainerDragStart}
              onMouseLeave={handleDragEnd}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              ref={imgContainerRef}
            >
              {!img && <Spin className={styles.spin} indicator={<LoadingOutlined className={styles.spinner} spin />} />}
              {img &&
                (!imgLoaded ? (
                  <img onLoad={handleImgLoad} src={img?.url} />
                ) : (
                  <svg
                    height={imageSizeRef.current.height * scaleRef.current}
                    ref={svgRef}
                    viewBox={`0 0 ${imageSizeRef.current.width} ${imageSizeRef.current.height}`}
                    width={imageSizeRef.current.width * scaleRef.current}
                  >
                    <image height={imageSizeRef.current.height} href={img?.url} width={imageSizeRef.current.width} />
                    {points.map((p, idx) => (
                      <g className={classNames({ [styles.selected]: idx === selectedPointIdx })} key={idx}>
                        <circle
                          cx={p[0]}
                          cy={p[1]}
                          onMouseDown={(e) => handlePointDragStart(idx, e)}
                          r={5 / scaleRef.current}
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
              <button onClick={() => handleZoom(-0.2)} type="button">
                <ObjectPanelIcons.Minus height="20" width="20" />
              </button>
              <button onClick={() => handleZoom(0.2)} type="button">
                <ObjectPanelIcons.Plus height="20" width="20" />
              </button>
            </div>
          </div>
        </Col>
        <Col span={8}>
          {selectedPointIdx >= 0 && points[selectedPointIdx] && (
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
