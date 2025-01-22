import React, { useEffect, useState } from 'react';

import { Button, Modal, Slider } from 'antd';
import type Cropper from 'cropperjs';

import PreviewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import FnWrapper from '@core/app/actions/beambox/svgeditor-function-wrapper';
import i18n from '@core/helpers/i18n';
import ImageData from '@core/helpers/image-data';
import traceAndImportPath from '@core/helpers/image-trace-panel/trace-and-import-path';

import styles from './StepTune.module.scss';

const LANG = i18n.lang.beambox.image_trace_panel;

interface Props {
  cropData: Cropper.Data;
  imageUrl: string;
  onClose: () => void;
  onGoBack: () => void;
}

const MODAL_PADDING_X = 80;
const MODAL_PADDING_Y = 210;

function StepTune({ cropData, imageUrl, onClose, onGoBack }: Props): React.JSX.Element {
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
      onComplete: (result) => setPreviewImgBase64(result.pngBase64),
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
  const maxWidth = window.innerWidth - MODAL_PADDING_X;
  const maxHieght = window.innerHeight - MODAL_PADDING_Y;
  const isWideImage = width / maxWidth > height / maxHieght;

  const renderFooter = () => (
    <>
      <Button onClick={onClose}>{LANG.cancel}</Button>
      <Button onClick={onGoBack}>{LANG.back}</Button>
      <Button onClick={handleOk} type="primary">
        {LANG.next}
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
      width={isWideImage ? maxWidth : undefined}
    >
      <div>
        <img
          id="tunedImage"
          src={previewImgBase64}
          style={isWideImage ? { width: `${maxWidth}px` } : { height: `${maxHieght}px` }}
        />
      </div>
      <div>
        <div className={styles.title}>{LANG.tuning}</div>
        <div>
          <h5 className={styles.subtitle}>{LANG.threshold}</h5>
          <Slider
            id="threshold"
            max={255}
            min={0}
            onAfterChange={(val: number) => generatePreviewImgUrl(val)}
            onChange={(val: number) => setThreshold(val)}
            step={1}
            value={threshold}
          />
        </div>
      </div>
    </Modal>
  );
}

export default StepTune;
