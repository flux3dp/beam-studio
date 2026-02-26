import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Checkbox, Col, ConfigProvider, Form, InputNumber, Modal, Row, Tooltip } from 'antd';
import classNames from 'classnames';

import alertCaller from '@core/app/actions/alert-caller';
import DoorChecker from '@core/app/actions/camera/preview-helper/DoorChecker';
import FisheyePreviewManagerV2 from '@core/app/actions/camera/preview-helper/FisheyePreviewManagerV2';
import FisheyePreviewManagerV4 from '@core/app/actions/camera/preview-helper/FisheyePreviewManagerV4';
import progressCaller from '@core/app/actions/progress-caller';
import moveLaserHead from '@core/app/components/dialogs/camera/common/moveLaserHead';
import {
  LayerModule,
  type LayerModuleType,
  printingModules,
  UVModules,
} from '@core/app/constants/layer-module/layer-modules';
import type { OffsetTuple } from '@core/app/constants/layer-module/moduleOffsets';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { getModuleOffsets, updateModuleOffsets } from '@core/helpers/device/moduleOffsets';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import type { FisheyeCameraParameters } from '@core/interfaces/FisheyePreview';

import { bm2FullAreaPerspectiveGrid } from '../common/solvePnPConstants';

import styles from './Align.module.scss';
import getPerspectiveForAlign from './getPerspectiveForAlign';

interface Props {
  fisheyeParam: FisheyeCameraParameters;
  module?: LayerModuleType;
  onBack: () => void;
  onClose: (complete: boolean) => void;
  title: string;
}

// Guess from half of the image size
const INIT_GUESS_X = Math.round(200 + 2150 / 2);
const INIT_GUESS_Y = Math.round(300 + 1500 / 2);
const PX_PER_MM = 5;
const PROGRESS_ID = 'calibration-align';

// TODO: fix test
const Align = ({
  fisheyeParam,
  module = LayerModule.LASER_UNIVERSAL,
  onBack,
  onClose,
  title,
}: Props): React.JSX.Element => {
  const imgContainerRef = useRef<HTMLDivElement | null>(null);
  const lang = useI18n();
  const [form] = Form.useForm();
  const [showLastResult, setShowLastResult] = useState(false);
  const dragStartPos = useRef<null | {
    scrollLeft: number;
    scrollTop: number;
    x: number;
    y: number;
  }>(null);
  const doorChecker = useRef<DoorChecker | null>(null);
  const hasInit = useRef(false);
  const [img, setImg] = useState<null | { blob: Blob; url: string }>(null);
  const isBM2 = useMemo(() => deviceMaster.currentDevice!.info.model === 'fbm2', []);

  const initSetup = useCallback(async () => {
    progressCaller.openNonstopProgress({
      id: PROGRESS_ID,
      message: lang.calibration.taking_picture,
    });
    try {
      await deviceMaster.connectCamera();

      if ('v' in fisheyeParam) {
        if (fisheyeParam.v === 4) {
          const manger = new FisheyePreviewManagerV4(
            deviceMaster.currentDevice!.info,
            fisheyeParam,
            bm2FullAreaPerspectiveGrid,
          );

          const workarea = getWorkarea(deviceMaster.currentDevice!.info.model, 'fbm2');
          const { cameraCenter } = workarea;

          if (isBM2) {
            doorChecker.current = doorChecker.current ?? new DoorChecker();

            const res = await doorChecker.current.doorClosedWrapper(() =>
              manger.setupFisheyePreview({ cameraPosition: cameraCenter, height: 0 }),
            );

            if (!res) return false;
          } else {
            await manger.setupFisheyePreview({ cameraPosition: cameraCenter, height: 0 });
          }
        } else if (fisheyeParam.v === 2) {
          const manager = new FisheyePreviewManagerV2(deviceMaster.currentDevice!.info, fisheyeParam);

          await manager.setupFisheyePreview({ defaultHeight: 0, focusPosition: 'E' });
        }
      } else {
        const perspectivePoints = await getPerspectiveForAlign(
          deviceMaster.currentDevice!.info,
          fisheyeParam,
          fisheyeParam.center || [INIT_GUESS_X, INIT_GUESS_Y],
        );
        const { d, k } = fisheyeParam;

        await deviceMaster.setFisheyeMatrix({ d, k, points: perspectivePoints });
      }

      return true;
    } finally {
      progressCaller.popById(PROGRESS_ID);
    }
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  const handleTakePicture = async (retryTimes = 0, relocate = false) => {
    if (!hasInit.current) {
      hasInit.current = await initSetup();
      relocate = false;

      if (!hasInit.current) {
        return;
      }
    }

    if (doorChecker.current && (!doorChecker.current.keepClosed || relocate)) {
      const res = await doorChecker.current.doorClosedWrapper(moveLaserHead);

      if (!res) {
        return;
      }
    }

    progressCaller.openNonstopProgress({
      id: PROGRESS_ID,
      message: lang.calibration.taking_picture,
    });

    const { imgBlob } = (await deviceMaster.takeOnePicture()) || {};

    if (!imgBlob) {
      if (retryTimes < 3) {
        handleTakePicture(retryTimes + 1);
      } else {
        alertCaller.popUpError({ message: 'Unable to get image' });
      }
    } else {
      setImg({ blob: imgBlob, url: URL.createObjectURL(imgBlob) });
    }

    progressCaller.popById(PROGRESS_ID);
  };

  useEffect(() => {
    handleTakePicture();

    return () => {
      deviceMaster.disconnectCamera();
      doorChecker.current?.destroy();
    };
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      if (img?.url) {
        URL.revokeObjectURL(img.url);
      }
    },
    [img],
  );

  const fisheyeCenter = useMemo(() => {
    if ('v' in fisheyeParam) {
      const { calibrationCenter, cameraCenter } = getWorkarea(
        deviceMaster.currentDevice!.info.model as WorkAreaModel,
        'ado1',
      );

      return calibrationCenter
        ? [calibrationCenter[0] * PX_PER_MM, calibrationCenter[1] * PX_PER_MM]
        : [cameraCenter![0] * PX_PER_MM, cameraCenter![1] * PX_PER_MM];
    }

    return fisheyeParam.center;
  }, [fisheyeParam]);
  const [lastResult, setLastResult] = useState<null | OffsetTuple>(null);

  useEffect(() => {
    getModuleOffsets({
      isRelative: true,
      module,
      useCache: false,
      workarea: deviceMaster.currentDevice!.info.model,
    })
      .then((offset) => {
        setLastResult(offset);
      })
      .catch(() => {});
  }, [module]);

  const getOffsetValueFromScroll = useCallback(
    (left: number, top: number) => {
      const x = (left - fisheyeCenter[0] + (imgContainerRef.current?.clientWidth ?? 0) / 2) / PX_PER_MM;
      const y = (top - fisheyeCenter[1] + (imgContainerRef.current?.clientHeight ?? 0) / 2) / PX_PER_MM;

      return { x, y };
    },
    [fisheyeCenter],
  );
  const getPxFromOffsetValue = useCallback(
    (x: number, y: number) => {
      const left = x * PX_PER_MM + fisheyeCenter[0];
      const top = y * PX_PER_MM + fisheyeCenter[1];

      return { left, top };
    },
    [fisheyeCenter],
  );
  const getScrollFromPx = useCallback((left: number, top: number) => {
    if (!imgContainerRef.current) {
      return { left, top };
    }

    return {
      left: left - imgContainerRef.current.clientWidth / 2,
      top: top - imgContainerRef.current.clientHeight / 2,
    };
  }, []);
  const lastResultScroll = useMemo(() => {
    if (!lastResult) {
      return null;
    }

    const { left, top } = getPxFromOffsetValue(lastResult[0], lastResult[1]);

    return getScrollFromPx(left, top);
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [lastResult, img]);

  const useLastConfig = useCallback(() => {
    if (imgContainerRef.current && lastResultScroll) {
      imgContainerRef.current.scrollLeft = lastResultScroll.left;
      imgContainerRef.current.scrollTop = lastResultScroll.top;
    }
  }, [lastResultScroll]);

  const handleImgLoad = useCallback(() => {
    if (imgContainerRef.current) {
      if (!lastResult || !lastResultScroll) {
        imgContainerRef.current.scrollLeft = INIT_GUESS_X - imgContainerRef.current.clientWidth / 2;
        imgContainerRef.current.scrollTop = INIT_GUESS_Y - imgContainerRef.current.clientHeight / 2;
      } else {
        imgContainerRef.current.scrollLeft = lastResultScroll.left;
        imgContainerRef.current.scrollTop = lastResultScroll.top;
      }
    }
  }, [lastResult, lastResultScroll]);

  const handleValueChange = useCallback(
    (key: 'x' | 'y', val: null | number) => {
      if (imgContainerRef.current && val !== null) {
        if (key === 'x') {
          const { left } = getPxFromOffsetValue(val, 0);
          const { left: leftScroll } = getScrollFromPx(left, 0);

          imgContainerRef.current.scrollLeft = leftScroll;

          return;
        }

        const { top } = getPxFromOffsetValue(0, val);
        const { top: topScroll } = getScrollFromPx(0, top);

        imgContainerRef.current.scrollTop = topScroll;
      }
    },
    [getPxFromOffsetValue, getScrollFromPx],
  );

  const handleContainerScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { x, y } = getOffsetValueFromScroll(e.currentTarget.scrollLeft, e.currentTarget.scrollTop);

      form.setFieldsValue({ x, y });
    },
    [form, getOffsetValueFromScroll],
  );

  const handleDone = useCallback(() => {
    const { x, y } = form.getFieldsValue();

    updateModuleOffsets([x, y], {
      isRelative: true,
      module,
      shouldWrite: true,
      workarea: deviceMaster.currentDevice!.info.model,
    });
    onClose(true);
  }, [form, onClose, module]);
  const lastValueDisplay = useMemo(() => {
    if (!lastResult) return [0, 0];

    const { left, top } = getPxFromOffsetValue(lastResult[0], lastResult[1]);

    return [left, top];
  }, [getPxFromOffsetValue, lastResult]);

  const handleContainerDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    dragStartPos.current = {
      scrollLeft: e.currentTarget.scrollLeft,
      scrollTop: e.currentTarget.scrollTop,
      x: e.screenX,
      y: e.screenY,
    };
  }, []);

  const handleContainerDragMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (dragStartPos.current) {
      const { scrollLeft, scrollTop, x, y } = dragStartPos.current;

      e.currentTarget.scrollLeft = scrollLeft - (e.screenX - x);
      e.currentTarget.scrollTop = scrollTop - (e.screenY - y);
    }
  }, []);

  const handleContainerDragEnd = useCallback(() => {
    dragStartPos.current = null;
  }, []);

  return (
    <Modal
      centered
      closable
      footer={[
        <Button className={styles['footer-button']} key="back" onClick={onBack}>
          {lang.buttons.back}
        </Button>,
        isBM2 ? (
          <Button className={styles['footer-button']} key="relocate" onClick={() => handleTakePicture(0, true)}>
            {lang.calibration.relocate_camera}
          </Button>
        ) : null,
        <Button className={styles['footer-button']} key="take-picture" onClick={() => handleTakePicture(0)}>
          {lang.calibration.retake}
        </Button>,
        <Button className={styles['footer-button']} key="done" onClick={handleDone} type="primary">
          {lang.buttons.done}
        </Button>,
      ]}
      maskClosable={false}
      onCancel={() => onClose(false)}
      open
      title={title}
    >
      <Row>
        <div className={styles.text}>
          {printingModules.has(module) || UVModules.has(module)
            ? lang.calibration.align_red_cross_print
            : lang.calibration.align_red_cross_cut}
          <Tooltip className={styles.tooltip} title={lang.calibration.hint_adjust_parameters} trigger="hover">
            <QuestionCircleOutlined />
          </Tooltip>
        </div>
      </Row>
      <Row gutter={[16, 0]}>
        <Col span={12}>
          <div className={styles.container}>
            <div
              className={styles['img-container']}
              onMouseDown={handleContainerDragStart}
              onMouseLeave={handleContainerDragEnd}
              onMouseMove={handleContainerDragMove}
              onMouseUp={handleContainerDragEnd}
              onScroll={handleContainerScroll}
              ref={imgContainerRef}
            >
              <img onLoad={handleImgLoad} src={img?.url} />
              {lastResult && showLastResult && (
                <div className={styles.last} style={{ left: lastValueDisplay[0], top: lastValueDisplay[1] }}>
                  <div className={classNames(styles.bar, styles.hor)} />
                  <div className={classNames(styles.bar, styles.vert)} />
                </div>
              )}
            </div>
            <div className={styles.mark}>
              <div className={classNames(styles.bar, styles.hor)} />
              <div className={classNames(styles.bar, styles.vert)} />
            </div>
          </div>
        </Col>
        <Col span={12}>
          <ConfigProvider
            theme={{
              components: {
                Form: {
                  itemMarginBottom: 12,
                },
              },
            }}
          >
            <Form form={form} size="middle">
              <Form.Item initialValue={0} label={lang.calibration.dx} name="x">
                <InputNumber<number>
                  onChange={(val) => handleValueChange('x', val)}
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
                  precision={1}
                  step={0.1}
                  type="number"
                />
              </Form.Item>
              <Form.Item initialValue={0} label={lang.calibration.dy} name="y">
                <InputNumber<number>
                  onChange={(val) => handleValueChange('y', val)}
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
                  precision={1}
                  step={0.1}
                  type="number"
                />
              </Form.Item>
            </Form>
          </ConfigProvider>
          {lastResult && (
            <Checkbox className={styles.checkbox} onChange={(e) => setShowLastResult(e.target.checked)}>
              {lang.calibration.show_last_config}
            </Checkbox>
          )}
          <div className={styles.hints}>
            {lastResult && (
              <Button onClick={useLastConfig} size="small">
                {lang.calibration.use_last_config}
              </Button>
            )}
          </div>
        </Col>
      </Row>
    </Modal>
  );
};

export default Align;
