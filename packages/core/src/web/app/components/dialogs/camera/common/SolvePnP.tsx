import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Col, Flex, InputNumber, Row, Tooltip } from 'antd';
import classNames from 'classnames';

import alertCaller from '@core/app/actions/alert-caller';
import type DoorChecker from '@core/app/actions/camera/preview-helper/DoorChecker';
import moveLaserHead from '@core/app/components/dialogs/camera/common/moveLaserHead';
import DraggableModal from '@core/app/widgets/DraggableModal';
import { cameraCalibrationApi } from '@core/helpers/api/camera-calibration';
import { setExposure } from '@core/helpers/device/camera/cameraExposure';
import useDidUpdateEffect from '@core/helpers/hooks/useDidUpdateEffect';
import useI18n from '@core/helpers/useI18n';
import type { FisheyeCaliParameters } from '@core/interfaces/FisheyePreview';

import ExposureSlider from './ExposureSlider';
import ImageDisplay from './ImageDisplay';
import PointIndicator from './PointIndicator';
import styles from './SolvePnP.module.scss';
import { adorPnPPoints } from './solvePnPConstants';
import StepProgress from './StepProgress';
import Title from './Title';
import useCamera from './useCamera';

interface Props {
  animationSrcs?: Array<{ src: string; type: string }>;
  cameraIndex?: number;
  currentStep?: number;
  dh: number;
  doorChecker?: DoorChecker | null;
  hasNext?: boolean;
  imgSource?: 'usb' | 'wifi';
  initExposure?: number;
  initialPoints?: Array<[number, number]>;
  initInterestArea?: { height: number; width: number; x: number; y: number };
  onBack: () => void;
  onClose: (complete: boolean) => void;
  onNext: (rvec: number[][], tvec: number[][], imgPoints: Array<[number, number]>) => void;
  params: FisheyeCaliParameters;
  refPoints?: Array<[number, number]>;
  steps?: string[];
  title?: string;
  titleLink?: string;
}

type HandleImgOpts = {
  shouldFindCorners?: boolean;
};

const SolvePnP = ({
  animationSrcs,
  cameraIndex,
  currentStep,
  dh,
  doorChecker,
  hasNext = false,
  imgSource = 'wifi',
  initExposure,
  initialPoints,
  initInterestArea,
  onBack,
  onClose,
  onNext,
  params,
  refPoints = adorPnPPoints,
  steps,
  title,
  titleLink,
}: Props): React.JSX.Element => {
  const [img, setImg] = useState<null | { blob: Blob; success: boolean; url: string }>(null);
  const [points, setPoints] = useState<Array<[number, number]>>(initialPoints ?? []);
  const [zoomPoints, setZoomPoints] = useState<Array<[number, number]>>(initialPoints ?? []);
  const [selectedPointIdx, setSelectedPointIdx] = useState<number>(0);
  const dragStartPos = useRef<null | {
    group: SVGGElement;
    pointIdx: number;
    startX: number;
    startY: number;
    x: number;
    y: number;
  }>(null);
  const hasFoundPoints = useRef<boolean>(Boolean(initialPoints));
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const lang = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);

  useDidUpdateEffect(() => {
    videoRef.current?.load();
  }, [animationSrcs]);

  useEffect(
    () => () => {
      if (img) URL.revokeObjectURL(img.url);
    },
    [img],
  );

  const displayTitle = useMemo(() => {
    const base = title ?? lang.calibration.title_align_marker_points;

    if (steps && currentStep !== undefined) {
      return `${base} (${currentStep + 1}/${steps.length})`;
    }

    return base;
  }, [currentStep, lang.calibration, steps, title]);

  const handleImg = useCallback(
    async (imgBlob: Blob, opts: HandleImgOpts = {}) => {
      try {
        let interestArea: undefined | { height: number; width: number; x: number; y: number } = undefined;

        const container = imgContainerRef.current;
        const svg = container?.querySelector('svg');
        const image = svg?.querySelector('image')!;

        if (image && hasFoundPoints.current) {
          const scale = svg!.clientWidth / (initInterestArea?.width ?? Number(image.getAttribute('width')))!;
          const { clientHeight, clientWidth, scrollLeft, scrollTop } = container!;

          if (svg!.clientWidth > clientWidth || svg!.clientHeight > clientHeight) {
            interestArea = {
              height: Math.ceil(clientHeight / scale),
              width: Math.ceil(clientWidth / scale),
              x: Math.round(scrollLeft / scale) + (initInterestArea?.x ?? 0),
              y: Math.round(scrollTop / scale) + (initInterestArea?.y ?? 0),
            };
          }
        }

        const { shouldFindCorners = true } = opts;

        if (!shouldFindCorners) {
          const { blob } = await cameraCalibrationApi.remapImage(imgBlob);

          setImg({ blob, success: true, url: URL.createObjectURL(blob) });

          return true;
        }

        const res = await cameraCalibrationApi.solvePnPFindCorners(
          imgBlob,
          dh,
          refPoints,
          interestArea || initInterestArea,
        );

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
              await cameraCalibrationApi.updateData(params);

              return await handleImg(imgBlob, opts);
            }

            alertCaller.popUpError({ message: 'No chessboard data detected, please restart calibration.' });
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

  const {
    autoExposure,
    exposureSetting,
    handleTakePicture: takePicture,
    setAutoExposure,
    setExposureSetting,
  } = useCamera<HandleImgOpts>(handleImg, {
    firstImageArgs: { shouldFindCorners: !initialPoints },
    index: cameraIndex,
    initExposure,
    source: imgSource,
  });

  const handleTakePicture = useCallback(
    async ({ handleImgOpts, relocate = false }: { handleImgOpts?: HandleImgOpts; relocate?: boolean } = {}) => {
      if (doorChecker && (!doorChecker.keepClosed || relocate)) {
        const res = await doorChecker.doorClosedWrapper(() => moveLaserHead(undefined, { shouldKeepPosition: true }));

        if (!res) return;
      }

      await takePicture({ callbackArgs: handleImgOpts });
    },
    [doorChecker, takePicture],
  );

  useDidUpdateEffect(() => {
    const handler = async () => {
      let needRetakeImage = !initialPoints;

      setPoints(initialPoints ?? []);
      setSelectedPointIdx(0);

      if (initialPoints) setZoomPoints(initialPoints);

      if (exposureSetting && initExposure && exposureSetting.value !== initExposure) {
        await setExposure(initExposure);
        setExposureSetting({ ...exposureSetting!, value: initExposure });
        needRetakeImage = true;
      }

      if (!needRetakeImage) return;

      setImg(null);
      handleTakePicture({ handleImgOpts: { shouldFindCorners: !initialPoints } });
    };

    handler();
  }, [initExposure, initialPoints, refPoints, handleTakePicture]);

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
        let x = Number.parseInt(circle.getAttribute('cx')!, 10);
        let y = Number.parseInt(circle.getAttribute('cy')!, 10);

        if (initInterestArea) {
          x = Math.min(Math.max(x, initInterestArea.x), initInterestArea.x + initInterestArea.width);
          y = Math.min(Math.max(y, initInterestArea.y), initInterestArea.y + initInterestArea.height);
        }

        setPoints((prev) => prev.map((p, i) => (i === pointIdx ? [x, y] : p)));
      }
    }

    dragStartPos.current = null;
  }, [initInterestArea]);

  const handleDone = async () => {
    const res = await cameraCalibrationApi.solvePnPCalculate(dh, points, refPoints);

    if (res.success) {
      const { rvec, tvec } = res.data;

      onNext(rvec, tvec, points);
    } else {
      alertCaller.popUpError({ message: 'Failed to solvePnP' });
    }
  };

  const positionText = useMemo(
    () =>
      selectedPointIdx >= 0
        ? (lang.calibration[`align_${refPoints.length}_${selectedPointIdx}` as keyof typeof lang.calibration] as string)
        : null,
    [lang, selectedPointIdx, refPoints.length],
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
    <DraggableModal
      closable
      footer={
        <div className={styles.footer}>
          <div>
            {doorChecker && (
              <Tooltip title={lang.calibration.relocate_camera_desc}>
                <Button
                  className={styles['footer-button']}
                  key="relocate"
                  onClick={() => handleTakePicture({ relocate: true })}
                >
                  {lang.calibration.relocate_camera}
                </Button>
              </Tooltip>
            )}
          </div>
          <div>
            <Button className={styles['footer-button']} key="back" onClick={onBack}>
              {lang.buttons.back}
            </Button>

            <Button
              className={styles['footer-button']}
              disabled={!img?.success}
              key="done"
              onClick={handleDone}
              type="primary"
            >
              {hasNext ? lang.buttons.next : lang.buttons.done}
            </Button>
          </div>
        </div>
      }
      maskClosable={false}
      onCancel={() => onClose(false)}
      open
      scrollableContent
      title={<Title link={titleLink} title={displayTitle} />}
      width="80vw"
    >
      <div className={styles.grid}>
        <div>
          <ol className={styles.steps}>
            <li>{lang.calibration.solve_pnp_step1}</li>
            {doorChecker && <li>{lang.calibration.solve_pnp_keep_door_closed}</li>}
          </ol>
          {steps && <StepProgress currentStep={currentStep ?? 0} steps={steps} />}
        </div>
        <div className={styles.animation}>
          {animationSrcs && (
            <video autoPlay loop muted ref={videoRef}>
              {animationSrcs.map(({ src, type }) => (
                <source key={src} src={src} type={type} />
              ))}
            </video>
          )}
        </div>
        <ImageDisplay
          className={styles.image}
          displayArea={initInterestArea}
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
        <div>
          {selectedPointIdx >= 0 && (
            <Flex className={styles.info} gap={8} justify="space-between" vertical>
              <div>
                <Row align="middle" gutter={[0, 8]}>
                  {positionText && (
                    <Col className={styles.position} span={24}>
                      {positionText}
                    </Col>
                  )}
                  <Col className={styles['point-id']} span={24}>
                    Point {selectedPointIdx}
                  </Col>
                  <Col span={3}>
                    <label className={styles.label} htmlFor="point-x-input">
                      X
                    </label>
                  </Col>
                  <Col span={9}>
                    <InputNumber<number>
                      className={styles.input}
                      disabled={!points[selectedPointIdx]}
                      id="point-x-input"
                      onChange={(val) => {
                        if (val) setPoints((prev) => prev.map((p, i) => (i === selectedPointIdx ? [val, p[1]] : p)));
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                      onKeyUp={(e) => e.stopPropagation()}
                      precision={0}
                      step={1}
                      type="number"
                      value={points[selectedPointIdx]?.[0] ?? 0}
                    />
                  </Col>
                  <Col span={3}>
                    <label className={styles.label} htmlFor="point-y-input">
                      Y
                    </label>
                  </Col>
                  <Col span={9}>
                    <InputNumber<number>
                      className={styles.input}
                      disabled={!points[selectedPointIdx]}
                      id="point-y-input"
                      onChange={(val) => {
                        if (val) setPoints((prev) => prev.map((p, i) => (i === selectedPointIdx ? [p[0], val] : p)));
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                      onKeyUp={(e) => e.stopPropagation()}
                      precision={0}
                      step={1}
                      type="number"
                      value={points[selectedPointIdx]?.[1] ?? 0}
                    />
                  </Col>
                </Row>
              </div>
              <PointIndicator
                currentIndex={selectedPointIdx}
                onSelect={setSelectedPointIdx}
                points={refPoints.length as 4 | 8}
              />
            </Flex>
          )}
        </div>
        <ExposureSlider
          autoExposure={autoExposure}
          className={styles.exposure}
          exposureSetting={exposureSetting}
          onChanged={() => handleTakePicture({ handleImgOpts: { shouldFindCorners: false } })}
          onRetakePicture={handleTakePicture}
          setAutoExposure={setAutoExposure}
          setExposureSetting={setExposureSetting}
        />
      </div>
    </DraggableModal>
  );
};

export default SolvePnP;
