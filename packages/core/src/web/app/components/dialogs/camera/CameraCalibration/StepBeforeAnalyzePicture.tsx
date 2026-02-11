import React, { use, useEffect, useState } from 'react';

import { QuestionOutlined } from '@ant-design/icons';
import { Button, Col, Form, InputNumber, Row, Space } from 'antd';

import Alert from '@core/app/actions/alert-caller';
import Constant from '@core/app/actions/beambox/constant';
import PreviewModeController from '@core/app/actions/beambox/preview-mode-controller';
import Progress from '@core/app/actions/progress-caller';
import AlertConstants from '@core/app/constants/alert-constants';
import { STEP_FINISH, STEP_REFOCUS } from '@core/app/constants/cameraConstants';
import { CalibrationContext } from '@core/app/contexts/CalibrationContext';
import DraggableModal from '@core/app/widgets/DraggableModal';
import { sendPictureThenSetConfig } from '@core/helpers/camera-calibration-helper';
import useI18n from '@core/helpers/useI18n';
import type { CameraConfig } from '@core/interfaces/Camera';

const StepBeforeAnalyzePicture = (): React.JSX.Element => {
  const lang = useI18n().calibration;
  const [showHint, setShowHint] = useState(false);
  const [showLastConfig, setShowLastConfig] = useState(false);
  const [form] = Form.useForm();
  const context = use(CalibrationContext);
  const {
    borderless,
    cameraPosition,
    currentOffset,
    device,
    gotoNextStep,
    imgBlobUrl,
    lastConfig,
    onClose,
    setCameraPosition,
    setCurrentOffset,
    setImgBlobUrl,
    unit,
  } = context;

  useEffect(() => {
    setShowHint(true);
  }, []);

  const renderHintModal = () => {
    const virtualSquare = $('.modal-camera-calibration .virtual-square');
    const position1 = virtualSquare.offset()!;

    position1.top += (virtualSquare.height() || 0) + 5;

    const controls = $('.modal-camera-calibration .controls');
    const position2 = controls.offset()!;

    position2.left += 30;
    position2.top -= 45;

    return (
      <div className="hint-modal-background" onClick={() => setShowHint(false)}>
        <div className="hint-box" style={position1}>
          <div className="arrowup" />
          <div className="hint-body">{lang.hint_red_square}</div>
        </div>
        <div className="hint-box" style={position2}>
          <div className="hint-body">{lang.hint_adjust_parameters}</div>
          <div className="arrowdown" />
        </div>
      </div>
    );
  };

  const moveAndRetakePicture = async (dir: string) => {
    try {
      Progress.openNonstopProgress({
        id: 'taking-picture',
        message: lang.taking_picture,
        timeout: 30000,
      });

      let { x, y } = cameraPosition;

      switch (dir) {
        case 'up':
          y -= 3;
          break;
        case 'down':
          y += 3;
          break;
        case 'left':
          x -= 3;
          break;
        case 'right':
          x += 3;
          break;
        default:
          break;
      }

      const blobUrl = await PreviewModeController.getPhotoAfterMoveTo(x, y);

      console.log(x, y);
      setCameraPosition({ x, y });
      setImgBlobUrl(blobUrl!);
    } finally {
      Progress.popById('taking-picture');
    }
  };

  const imageScale = 200 / 280;
  const mmToImage = 10 * imageScale;
  const imgBackground = { background: `url(${imgBlobUrl})` };

  const calculateSquarePosition = (cc: CameraConfig) => {
    const { centerX, centerY } = Constant.camera.calibrationPicture;
    const width = (25 * mmToImage) / cc.SX;
    const height = (25 * mmToImage) / cc.SY;
    const left = 100 - width / 2 - ((cc.X - centerX + cameraPosition.x) * mmToImage) / cc.SX;
    const top = 100 - height / 2 - ((cc.Y - centerY + cameraPosition.y) * mmToImage) / cc.SY;

    return { height, left, top, transform: `rotate(${-cc.R * (180 / Math.PI)}deg)`, width };
  };

  const squareStyle = calculateSquarePosition(currentOffset);
  const lastConfigSquareStyle = calculateSquarePosition(lastConfig);

  const handleValueChange = (key: string, val: number) => {
    console.log('Key', key, '=', val);
    setCurrentOffset({ ...currentOffset, [key]: val });
  };

  const convertToDisplayValue = (cc: any) => ({
    R: cc.R * (Math.PI / 180),
    SX: (3.25 - cc.SX) * (100 / 1.625),
    SY: (3.25 - cc.SY) * (100 / 1.625),
    X: cc.X - 15,
    Y: cc.Y - 30,
  });

  const useLastConfigValue = () => {
    setCurrentOffset({ ...lastConfig });
    form.setFieldsValue(convertToDisplayValue(lastConfig));
  };

  const hintModal = showHint ? renderHintModal() : null;
  const lastConfigSquare = showLastConfig ? (
    <div className="virtual-square last-config" style={lastConfigSquareStyle} />
  ) : null;
  const manualCalibration = (
    <Row
      onKeyDown={(e) => {
        e.stopPropagation();
      }}
    >
      <Col span={12}>
        <div className="img-center" style={imgBackground}>
          <div className="virtual-square" style={squareStyle} />
          {lastConfigSquare}
          <div className="camera-control up" onClick={() => moveAndRetakePicture('up')} />
          <div className="camera-control down" onClick={() => moveAndRetakePicture('down')} />
          <div className="camera-control left" onClick={() => moveAndRetakePicture('left')} />
          <div className="camera-control right" onClick={() => moveAndRetakePicture('right')} />
        </div>
        <div className="checkbox-container" onClick={() => setShowLastConfig(!showLastConfig)}>
          <input checked={showLastConfig} onChange={() => {}} type="checkbox" />
          <div className="title">{lang.show_last_config}</div>
        </div>
      </Col>
      <Col span={12}>
        <Form className="controls" form={form} size="small">
          <Form.Item initialValue={currentOffset.X - 15} label={lang.dx} name="X">
            <InputNumber
              addonAfter={unit}
              max={50}
              min={-50}
              onChange={(val) => handleValueChange('X', val! + 15)}
              precision={2}
              step={unit === 'inches' ? 0.005 : 0.1}
              type="number"
            />
          </Form.Item>
          <Form.Item initialValue={currentOffset.Y - 30} label={lang.dy} name="Y">
            <InputNumber
              addonAfter={unit}
              max={50}
              min={-50}
              onChange={(val) => handleValueChange('Y', val! + 30)}
              precision={2}
              step={unit === 'inches' ? 0.005 : 0.1}
            />
          </Form.Item>
          <Form.Item initialValue={currentOffset.R * (180 / Math.PI)} label={lang.rotation_angle} name="R">
            <InputNumber
              addonAfter="deg"
              max={180}
              min={-180}
              onChange={(val) => handleValueChange('R', val! * (Math.PI / 180))}
              precision={3}
              step={0.1}
            />
          </Form.Item>
          <Form.Item initialValue={(3.25 - currentOffset.SX) * (100 / 1.625)} label={lang.x_ratio} name="SX">
            <InputNumber
              addonAfter="%"
              max={200}
              min={10}
              onChange={(val) => handleValueChange('SX', (200 - val!) * (1.625 / 100))}
              precision={2}
              step={0.1}
              type="number"
            />
          </Form.Item>
          <Form.Item initialValue={(3.25 - currentOffset.SY) * (100 / 1.625)} label={lang.y_ratio} name="SY">
            <InputNumber
              addonAfter="%"
              max={200}
              min={10}
              onChange={(val) => handleValueChange('SY', (200 - val!) * (1.625 / 100))}
              precision={2}
              step={0.1}
              type="number"
            />
          </Form.Item>
          <Space>
            <Button onClick={useLastConfigValue}>{lang.use_last_config}</Button>
            <Button onClick={() => setShowHint(true)}>
              <QuestionOutlined />
            </Button>
          </Space>
        </Form>
        {hintModal}
      </Col>
    </Row>
  );

  const refocus = async () => {
    try {
      await PreviewModeController.end({ shouldWaitForEnd: true });
      await sendPictureThenSetConfig(currentOffset, device, borderless);
      gotoNextStep(STEP_FINISH);
    } catch (error) {
      console.log(error);
      Alert.popUp({
        callbacks: () => gotoNextStep(STEP_REFOCUS),
        id: 'menu-item',
        message: `#816 ${(error as string).toString().replace('Error: ', '')}`,
        type: AlertConstants.SHOW_POPUP_ERROR,
      });
    }
  };

  return (
    <DraggableModal
      className="modal-camera-calibration"
      closable={false}
      footer={[
        <Button
          onClick={async () => {
            await PreviewModeController.end({ shouldWaitForEnd: true });
            gotoNextStep(STEP_REFOCUS);
          }}
        >
          {lang.back}
        </Button>,
        <Button onClick={() => onClose(false)}>{lang.cancel}</Button>,
        <Button onClick={refocus} type="primary">
          {lang.next}
        </Button>,
      ]}
      open
      title={lang.camera_calibration}
      width={500}
    >
      {manualCalibration}
    </DraggableModal>
  );
};

export default StepBeforeAnalyzePicture;
