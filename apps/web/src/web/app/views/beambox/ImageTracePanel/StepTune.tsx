import Cropper from 'cropperjs';
import React, { useEffect, useState } from 'react';
import { Button, Modal, Slider } from 'antd';

import FnWrapper from 'app/actions/beambox/svgeditor-function-wrapper';
import ImageData from 'helpers/image-data';
import i18n from 'helpers/i18n';
import PreviewModeBackgroundDrawer from 'app/actions/beambox/preview-mode-background-drawer';
import traceAndImportPath from 'helpers/image-trace-panel/trace-and-import-path';

import styles from './StepTune.module.scss';

const LANG = i18n.lang.beambox.image_trace_panel;
interface Props {
  imageUrl: string;
  cropData: Cropper.Data;
  onGoBack: () => void;
  onClose: () => void;
}

const MODAL_PADDING_X = 80;
const MODAL_PADDING_Y = 210;

function StepTune({ imageUrl, cropData, onGoBack, onClose }: Props): JSX.Element {
  const [threshold, setThreshold] = useState(128);
  const [previewImgBase64, setPreviewImgBase64] = useState('');

  const generatePreviewImgUrl = (val: number) => {
    ImageData(imageUrl, {
      width: 0,
      height: 0,
      grayscale: {
        is_rgba: true,
        is_shading: false,
        threshold: val,
        is_svg: false,
      },
      onComplete: (result) => setPreviewImgBase64(result.pngBase64),
    });
  };
  // listen event on slide onAfterChange but not here to avoid massive calculation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => generatePreviewImgUrl(threshold), []);

  const handleOk = async () => {
    const { minX, minY } = PreviewModeBackgroundDrawer.getCoordinates();
    const dimension = {
      x: cropData.x + minX,
      y: cropData.y + minY,
      width: cropData.width,
      height: cropData.height,
    };
    await traceAndImportPath(previewImgBase64, dimension);
    FnWrapper.insertImage(imageUrl, dimension, threshold);
    onClose();
  };
  const { width, height } = cropData;
  const maxWidth = window.innerWidth - MODAL_PADDING_X;
  const maxHieght = window.innerHeight - MODAL_PADDING_Y;
  const isWideImage = width / maxWidth > height / maxHieght;

  const renderFooter = () => (
    <>
      <Button onClick={onClose}>{LANG.cancel}</Button>
      <Button onClick={onGoBack}>{LANG.back}</Button>
      <Button type="primary" onClick={handleOk}>{LANG.next}</Button>
    </>
  );

  return (
    <Modal
      centered
      open
      closable={false}
      maskClosable={false}
      width={isWideImage ? maxWidth : undefined}
      footer={renderFooter()}
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
            min={0}
            max={255}
            step={1}
            value={threshold}
            onChange={(val: number) => setThreshold(val)}
            onAfterChange={(val: number) => generatePreviewImgUrl(val)}
          />
        </div>
      </div>
    </Modal>
  );
}

export default StepTune;
