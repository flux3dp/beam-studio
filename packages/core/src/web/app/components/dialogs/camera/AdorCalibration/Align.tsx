import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Checkbox, Col, ConfigProvider, Form, InputNumber, Modal, Row, Tooltip } from 'antd';
import classNames from 'classnames';

import alertCaller from '@core/app/actions/alert-caller';
import beamboxPreference from '@core/app/actions/beambox/beambox-preference';
import FisheyePreviewManagerV2 from '@core/app/actions/camera/preview-helper/FisheyePreviewManagerV2';
import progressCaller from '@core/app/actions/progress-caller';
import LayerModule from '@core/app/constants/layer-module/layer-modules';
import defaultModuleOffset from '@core/app/constants/layer-module/module-offsets';
import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { setFisheyeConfig } from '@core/helpers/camera-calibration-helper';
import deviceMaster from '@core/helpers/device-master';
import useI18n from '@core/helpers/useI18n';
import type { FisheyeCameraParametersV1, FisheyeCameraParametersV2 } from '@core/interfaces/FisheyePreview';

import styles from './Align.module.scss';
import CalibrationType from './calibrationTypes';
import getPerspectiveForAlign from './getPerspectiveForAlign';

interface Props {
  fisheyeParam: FisheyeCameraParametersV1 | FisheyeCameraParametersV2;
  onBack: () => void;
  onClose: (complete: boolean) => void;
  title: string;
  type: CalibrationType;
}

// Guess from half of the image size
const INIT_GUESS_X = Math.round(200 + 2150 / 2);
const INIT_GUESS_Y = Math.round(300 + 1500 / 2);
const PX_PER_MM = 5;
const PROGRESS_ID = 'calibration-align';

// TODO: fix test
const Align = ({ fisheyeParam, onBack, onClose, title, type }: Props): React.JSX.Element => {
  const imgContainerRef = useRef<HTMLDivElement>(null);
  const lang = useI18n();
  const [form] = Form.useForm();
  const [showLastResult, setShowLastResult] = useState(false);
  const dragStartPos = useRef<null | {
    scrollLeft: number;
    scrollTop: number;
    x: number;
    y: number;
  }>(null);

  const [img, setImg] = useState<{ blob: Blob; url: string }>(null);
  const handleTakePicture = async (retryTimes = 0) => {
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

  const initSetup = useCallback(async () => {
    progressCaller.openNonstopProgress({
      id: PROGRESS_ID,
      message: lang.calibration.taking_picture,
    });
    try {
      await deviceMaster.connectCamera();

      if ('v' in fisheyeParam) {
        const manager = new FisheyePreviewManagerV2(deviceMaster.currentDevice.info, fisheyeParam);

        await manager.setupFisheyePreview({ defaultHeight: 0, focusPosition: 'E' });
      } else {
        const perspectivePoints = await getPerspectiveForAlign(
          deviceMaster.currentDevice.info,
          fisheyeParam,
          fisheyeParam.center || [INIT_GUESS_X, INIT_GUESS_Y],
        );
        const { d, k } = fisheyeParam;

        await deviceMaster.setFisheyeMatrix({ d, k, points: perspectivePoints });
      }
    } finally {
      progressCaller.popById(PROGRESS_ID);
    }
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    initSetup().then(() => {
      handleTakePicture();
    });

    return () => deviceMaster.disconnectCamera();
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
      const { cameraCenter } = getWorkarea(deviceMaster.currentDevice.info.model as WorkAreaModel, 'ado1');

      return [cameraCenter[0] * PX_PER_MM, cameraCenter[1] * PX_PER_MM];
    }

    return fisheyeParam.center;
  }, [fisheyeParam]);
  const lastResult = useMemo(() => {
    if (type === CalibrationType.CAMERA) {
      return fisheyeCenter;
    }

    const moduleOffsets = beamboxPreference.read('module-offsets');
    let layerModule = LayerModule.PRINTER;

    if (type === CalibrationType.IR_LASER) {
      layerModule = LayerModule.LASER_1064;
    }

    const defaultVal = defaultModuleOffset[layerModule];
    const curVal = moduleOffsets?.[layerModule] || defaultVal;

    return [curVal[0] - defaultVal[0], curVal[1] - defaultVal[1]];
  }, [type, fisheyeCenter]);
  const getOffsetValueFromScroll = useCallback(
    (left, top) => {
      const x = (left - fisheyeCenter[0] + imgContainerRef.current.clientWidth / 2) / PX_PER_MM;
      const y = (top - fisheyeCenter[1] + imgContainerRef.current.clientHeight / 2) / PX_PER_MM;

      return { x, y };
    },
    [fisheyeCenter],
  );
  const getPxFromOffsetValue = useCallback(
    (x, y) => {
      const left = x * PX_PER_MM + fisheyeCenter[0];
      const top = y * PX_PER_MM + fisheyeCenter[1];

      return { left, top };
    },
    [fisheyeCenter],
  );
  const getScrollFromPx = useCallback((left, top) => {
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

    if (type === CalibrationType.CAMERA) {
      return getScrollFromPx(lastResult[0], lastResult[1]);
    }

    const { left, top } = getPxFromOffsetValue(lastResult[0], lastResult[1]);

    return getScrollFromPx(left, top);
    // eslint-disable-next-line hooks/exhaustive-deps
  }, [lastResult, type, img]);

  const useLastConfig = useCallback(() => {
    if (imgContainerRef.current && lastResultScroll) {
      imgContainerRef.current.scrollLeft = lastResultScroll.left;
      imgContainerRef.current.scrollTop = lastResultScroll.top;
    }
  }, [lastResultScroll]);

  const handleImgLoad = useCallback(() => {
    if (imgContainerRef.current) {
      if (!lastResult) {
        imgContainerRef.current.scrollLeft = INIT_GUESS_X - imgContainerRef.current.clientWidth / 2;
        imgContainerRef.current.scrollTop = INIT_GUESS_Y - imgContainerRef.current.clientHeight / 2;
      } else {
        imgContainerRef.current.scrollLeft = lastResultScroll.left;
        imgContainerRef.current.scrollTop = lastResultScroll.top;
      }
    }
  }, [lastResult, lastResultScroll]);

  const handleValueChange = useCallback(
    (key: 'x' | 'y', val: number) => {
      if (imgContainerRef.current) {
        if (key === 'x') {
          if (type === CalibrationType.CAMERA) {
            imgContainerRef.current.scrollLeft = val;
          } else {
            const { left } = getPxFromOffsetValue(val, 0);
            const { left: leftScroll } = getScrollFromPx(left, 0);

            imgContainerRef.current.scrollLeft = leftScroll;
          }

          return;
        }

        if (type === CalibrationType.CAMERA) {
          imgContainerRef.current.scrollTop = val;
        } else {
          const { top } = getPxFromOffsetValue(0, val);
          const { top: topScroll } = getScrollFromPx(0, top);

          imgContainerRef.current.scrollTop = topScroll;
        }
      }
    },
    [type, getPxFromOffsetValue, getScrollFromPx],
  );

  const handleContainerScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (type === CalibrationType.CAMERA) {
        form.setFieldsValue({
          x: Math.round(e.currentTarget.scrollLeft),
          y: Math.round(e.currentTarget.scrollTop),
        });
      } else {
        const { x, y } = getOffsetValueFromScroll(e.currentTarget.scrollLeft, e.currentTarget.scrollTop);

        form.setFieldsValue({ x, y });
      }
    },
    [form, getOffsetValueFromScroll, type],
  );

  const handleDone = useCallback(() => {
    const { x, y } = form.getFieldsValue();

    if (type === CalibrationType.CAMERA) {
      const cx = Math.round(x + imgContainerRef.current.clientWidth / 2);
      const cy = Math.round(y + imgContainerRef.current.clientHeight / 2);
      const newParam = { ...fisheyeParam, center: [cx, cy] } as FisheyeCameraParametersV1;

      try {
        setFisheyeConfig(newParam);
      } catch (err) {
        console.log(err);
        alertCaller.popUp({
          message: `${lang.calibration.failed_to_save_calibration_results} ${err}`,
        });
      }
      onClose(true);
    } else {
      let layerModule = LayerModule.PRINTER;

      if (type === CalibrationType.IR_LASER) {
        layerModule = LayerModule.LASER_1064;
      }

      const defaultVal = defaultModuleOffset[layerModule];
      const moduleOffsets = beamboxPreference.read('module-offsets');

      moduleOffsets[layerModule] = [x + defaultVal[0], y + defaultVal[1]];
      beamboxPreference.write('module-offsets', moduleOffsets);
      onClose(true);
    }
  }, [form, onClose, type, fisheyeParam, lang.calibration.failed_to_save_calibration_results]);
  const inputStep = useMemo(() => (type === CalibrationType.CAMERA ? 1 : 0.1), [type]);
  const inputPrecision = useMemo(() => (type === CalibrationType.CAMERA ? 0 : 1), [type]);
  const lastValueDisplay = useMemo(() => {
    if (type === CalibrationType.CAMERA) {
      return lastResult;
    }

    const { left, top } = getPxFromOffsetValue(lastResult[0], lastResult[1]);

    return [left, top];
  }, [getPxFromOffsetValue, type, lastResult]);

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
          {type === CalibrationType.PRINTER_HEAD
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
                  precision={inputPrecision}
                  step={inputStep}
                  type="number"
                />
              </Form.Item>
              <Form.Item initialValue={0} label={lang.calibration.dy} name="y">
                <InputNumber<number>
                  onChange={(val) => handleValueChange('y', val)}
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
                  precision={inputPrecision}
                  step={inputStep}
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
