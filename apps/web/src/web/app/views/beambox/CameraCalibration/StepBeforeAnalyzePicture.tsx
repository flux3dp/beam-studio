/* eslint-disable no-console */
import React, { useState, useEffect, useContext } from 'react';
import { Button, Col, Form, InputNumber, Modal, Row, Space } from 'antd';

import Alert from 'app/actions/alert-caller';
import AlertConstants from 'app/constants/alert-constants';
import Constant from 'app/actions/beambox/constant';
import PreviewModeController from 'app/actions/beambox/preview-mode-controller';
import Progress from 'app/actions/progress-caller';
import useI18n from 'helpers/useI18n';
import { CalibrationContext } from 'app/contexts/CalibrationContext';
import { CameraConfig } from 'interfaces/Camera';
import { STEP_FINISH, STEP_REFOCUS } from 'app/constants/camera-calibration-constants';
import { QuestionOutlined } from '@ant-design/icons';
import { sendPictureThenSetConfig } from 'helpers/camera-calibration-helper';

const StepBeforeAnalyzePicture = (): JSX.Element => {
  const lang = useI18n().calibration;
  const [showHint, setShowHint] = useState(false);
  const [showLastConfig, setShowLastConfig] = useState(false);
  const [form] = Form.useForm();
  const context = useContext(CalibrationContext);
  const {
    borderless,
    device,
    cameraPosition,
    setCameraPosition,
    lastConfig,
    currentOffset,
    imgBlobUrl,
    setCurrentOffset,
    setImgBlobUrl,
    gotoNextStep,
    unit,
    onClose,
  } = context;

  useEffect(() => {
    setShowHint(true);
  }, []);

  const renderHintModal = () => {
    const virtualSquare = $('.modal-camera-calibration .virtual-square');
    const position1 = virtualSquare.offset();
    position1.top += virtualSquare.height() + 5;
    const controls = $('.modal-camera-calibration .controls');
    const position2 = controls.offset();
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
      setImgBlobUrl(blobUrl);
    } finally {
      Progress.popById('taking-picture');
    }
  };

  const imageScale = 200 / 280;
  const mmToImage = 10 * imageScale;
  const imgBackground = {
    background: `url(${imgBlobUrl})`,
  };

  const calculateSquarePosition = (cc: CameraConfig) => {
    const width = (25 * mmToImage) / cc.SX;
    const height = (25 * mmToImage) / cc.SY;
    const { centerX, centerY } = Constant.camera.calibrationPicture;
    const left = 100 - width / 2 - ((cc.X - centerX + cameraPosition.x) * mmToImage) / cc.SX;
    const top = 100 - height / 2 - ((cc.Y - centerY + cameraPosition.y) * mmToImage) / cc.SY;
    return {
      width,
      height,
      left,
      top,
      transform: `rotate(${-cc.R * (180 / Math.PI)}deg)`,
    };
  };

  const squareStyle = calculateSquarePosition(currentOffset);
  const lastConfigSquareStyle = calculateSquarePosition(lastConfig);

  const handleValueChange = (key: string, val: number) => {
    console.log('Key', key, '=', val);
    setCurrentOffset({
      ...currentOffset,
      [key]: val,
    });
  };

  const convertToDisplayValue = (cc) => ({
    X: cc.X - 15,
    Y: cc.Y - 30,
    R: cc.R * (Math.PI / 180),
    SX: (3.25 - cc.SX) * (100 / 1.625),
    SY: (3.25 - cc.SY) * (100 / 1.625),
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
          <input type="checkbox" checked={showLastConfig} onChange={() => {}} />
          <div className="title">{lang.show_last_config}</div>
        </div>
      </Col>
      <Col span={12}>
        <Form size="small" className="controls" form={form}>
          <Form.Item name="X" label={lang.dx} initialValue={currentOffset.X - 15}>
            <InputNumber
              type="number"
              min={-50}
              max={50}
              precision={2}
              addonAfter={unit}
              onChange={(val) => handleValueChange('X', val + 15)}
              step={unit === 'inches' ? 0.005 : 0.1}
            />
          </Form.Item>
          <Form.Item name="Y" label={lang.dy} initialValue={currentOffset.Y - 30}>
            <InputNumber
              min={-50}
              max={50}
              precision={2}
              addonAfter={unit}
              onChange={(val) => handleValueChange('Y', val + 30)}
              step={unit === 'inches' ? 0.005 : 0.1}
            />
          </Form.Item>
          <Form.Item
            name="R"
            label={lang.rotation_angle}
            initialValue={currentOffset.R * (180 / Math.PI)}
          >
            <InputNumber
              min={-180}
              max={180}
              precision={3}
              addonAfter="deg"
              onChange={(val) => handleValueChange('R', val * (Math.PI / 180))}
              step={0.1}
            />
          </Form.Item>
          <Form.Item
            name="SX"
            label={lang.x_ratio}
            initialValue={(3.25 - currentOffset.SX) * (100 / 1.625)}
          >
            <InputNumber
              type="number"
              min={10}
              max={200}
              addonAfter="%"
              precision={2}
              onChange={(val) => handleValueChange('SX', (200 - val) * (1.625 / 100))}
              step={0.1}
            />
          </Form.Item>
          <Form.Item
            name="SY"
            label={lang.y_ratio}
            initialValue={(3.25 - currentOffset.SY) * (100 / 1.625)}
          >
            <InputNumber
              type="number"
              min={10}
              max={200}
              addonAfter="%"
              precision={2}
              onChange={(val) => handleValueChange('SY', (200 - val) * (1.625 / 100))}
              step={0.1}
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
        id: 'menu-item',
        type: AlertConstants.SHOW_POPUP_ERROR,
        message: `#816 ${error.toString().replace('Error: ', '')}`,
        callbacks: () => gotoNextStep(STEP_REFOCUS),
      });
    }
  };

  return (
    <Modal
      width={500}
      open
      centered
      closable={false}
      className="modal-camera-calibration"
      title={lang.camera_calibration}
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
        <Button type="primary" onClick={refocus}>
          {lang.next}
        </Button>,
      ]}
    >
      {manualCalibration}
    </Modal>
  );
};

export default StepBeforeAnalyzePicture;
