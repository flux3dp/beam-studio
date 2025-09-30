import React, { useEffect, useState } from 'react';

import { Button, Col, Modal, Row, Slider } from 'antd';
import type Cropper from 'cropperjs';

import PreviewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import layoutConstants from '@core/app/constants/layout-constants';
import ImageData from '@core/helpers/image-data';
import traceAndImportPath from '@core/helpers/image-trace-panel/trace-and-import-path';
import useI18n from '@core/helpers/useI18n';

import styles from './StepTune.module.scss';

interface Props {
  cropData: Cropper.Data;
  imageUrl: string;
  onClose: () => void;
  onGoBack: () => void;
}

const MODAL_PADDING_X = 48;
const MODAL_PADDING_Y = 84;

function StepTune({ cropData, imageUrl, onClose, onGoBack }: Props): React.JSX.Element {
  const lang = useI18n().beambox.image_trace_panel;
  const [threshold, setThreshold] = useState(128);
  const [previewImgBase64, setPreviewImgBase64] = useState('');

  const generatePreviewImgUrl = (val: number) => {
    ImageData(imageUrl, {
      grayscale: {
        is_rgba: true,
        is_shading: false,
        is_svg: false,
        threshold: val,
      },
      height: 0,
      onComplete: (result: { pngBase64: string }) => setPreviewImgBase64(result.pngBase64),
      width: 0,
    });
  };

  // listen event on slide onAfterChange but not here to avoid massive calculation
  // eslint-disable-next-line hooks/exhaustive-deps
  useEffect(() => generatePreviewImgUrl(threshold), []);

  const handleOk = async () => {
    const { minX, minY } = PreviewModeBackgroundDrawer.getCoordinates();
    const dimension = {
      height: cropData.height,
      width: cropData.width,
      x: cropData.x + minX,
      y: cropData.y + minY,
    };

    await traceAndImportPath(previewImgBase64, dimension);
    FnWrapper.insertImage(imageUrl, dimension, threshold);
    onClose();
  };
  const { height, width } = cropData;
  const maxModalWidth = Math.min(window.innerWidth - 32, 0.65 * window.innerWidth);
  const maxModalHeight = window.innerHeight - 2 * layoutConstants.topBarHeight;
  const maxAllowableWidth = maxModalWidth - MODAL_PADDING_X;
  const maxAllowableHeight = maxModalHeight - MODAL_PADDING_Y;
  const contentWidth = 330;
  const contentHeight = 75;

  const imageRatio = Math.max(
    // max allowed image ratio when control is aligned horizontally
    Math.min((maxAllowableWidth - contentWidth) / width, maxAllowableHeight / height),
    // max allowed image ratio when control is aligned vertically
    Math.min((maxAllowableHeight - contentHeight) / height, maxAllowableWidth / width),
  );

  const imgDisplayWidth = width * imageRatio;
  const imgDisplayHeight = height * imageRatio;

  const imgSizeStyle: React.CSSProperties = {
    height: imgDisplayHeight,
    width: imgDisplayWidth,
  };

  const renderFooter = () => (
    <>
      <Button onClick={onClose}>{lang.cancel}</Button>
      <Button onClick={onGoBack}>{lang.back}</Button>
      <Button onClick={handleOk} type="primary">
        {lang.next}
      </Button>
    </>
  );

  return (
    <Modal
      centered
      closable={false}
      footer={renderFooter()}
      maskClosable={false}
      open
      width={Math.min(imgDisplayWidth + contentWidth + MODAL_PADDING_X, maxModalWidth)}
    >
      <Row gutter={10} justify="center">
        <Col flex={`0 0 ${imgDisplayWidth}px`}>
          <img id="tunedImage" src={previewImgBase64} style={imgSizeStyle} />
        </Col>
        <Col flex={`1 1 ${contentWidth}px`}>
          <div className={styles.title}>{lang.tuning}</div>
          <div>
            <h5 className={styles.subtitle}>{lang.threshold}</h5>
            <Slider
              id="threshold"
              max={255}
              min={0}
              onChange={(val: number) => setThreshold(val)}
              onChangeComplete={(val: number) => generatePreviewImgUrl(val)}
              step={1}
              value={threshold}
            />
          </div>
        </Col>
      </Row>
    </Modal>
  );
}

export default StepTune;
