import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Button, ConfigProvider, Modal } from 'antd';
import Cropper from 'cropperjs';

import progressCaller from '@core/app/actions/progress-caller';
import Select from '@core/app/widgets/AntdSelect';
import calculateBase64 from '@core/helpers/image-edit-panel/calculate-base64';
import handleFinish from '@core/helpers/image-edit-panel/handle-finish';
import type { CropperDimension } from '@core/helpers/image-edit-panel/preprocess';
import { preprocessByUrl } from '@core/helpers/image-edit-panel/preprocess';
import jimpHelper from '@core/helpers/jimp-helper';
import { useIsMobile } from '@core/helpers/system-helper';
import useI18n from '@core/helpers/useI18n';

import styles from './CropPanel.module.scss';

interface Props {
  image: SVGImageElement;
  onClose: () => void;
  src: string;
}

interface HistoryItem {
  blobUrl: string;
  dimension: CropperDimension;
}

const MODAL_PADDING_X = 80;
const MODAL_PADDING_Y = 170;

const CropPanel = ({ image, onClose, src }: Props): React.JSX.Element => {
  const {
    beambox: { photo_edit_panel: t },
    global: tGlobal,
  } = useI18n();
  const cropperRef = useRef<Cropper>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);
  const originalSizeRef = useRef({ height: 0, width: 0 });
  const historyRef = useRef<HistoryItem[]>([]);
  const { isFullColor, isShading, threshold } = useMemo(
    () => ({
      isFullColor: image.getAttribute('data-fullcolor') === '1',
      isShading: image.getAttribute('data-shading') === 'true',
      threshold: Number.parseInt(image.getAttribute('data-threshold'), 10),
    }),
    [image],
  );
  const [state, setState] = useState({
    aspectRatio: Number.NaN,
    blobUrl: src,
    displayBase64: '',
    height: 0,
    imgAspectRatio: Number.NaN,
    width: 0,
  });

  const preprocess = async () => {
    progressCaller.openNonstopProgress({ id: 'photo-edit-processing', message: t.processing });

    const { blobUrl, dimension, originalHeight, originalWidth } = await preprocessByUrl(src);
    const { height, width } = dimension;

    originalSizeRef.current = { height: originalHeight, width: originalWidth };
    historyRef.current.push({ blobUrl, dimension });

    const displayBase64 = await calculateBase64(blobUrl, isShading, threshold, isFullColor);

    setState({
      aspectRatio: Number.NaN,
      blobUrl,
      displayBase64,
      height,
      imgAspectRatio: width / height,
      width,
    });
    progressCaller.popById('photo-edit-processing');
  };

  const cleanUpHistory = () => {
    for (let i = 0; i < historyRef.current.length; i += 1) {
      const { blobUrl } = historyRef.current[i];

      if (blobUrl !== src) {
        URL.revokeObjectURL(blobUrl);
      }
    }
  };

  useEffect(() => {
    preprocess();

    return () => {
      cleanUpHistory();
    };
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  const startCropper = (aspectRatio = Number.NaN) => {
    if (cropperRef.current) {
      cropperRef.current.destroy();
    }

    cropperRef.current = new Cropper(previewImageRef.current, {
      aspectRatio,
      autoCropArea: 1,
      minCropBoxHeight: 1,
      minCropBoxWidth: 1,
      viewMode: 2,
      zoomable: false,
    });
  };

  const getDimensionFromCropper = () => {
    const cropData = cropperRef.current.getData();
    const previewImage = previewImageRef.current;
    const x = Math.round(cropData.x);
    const y = Math.round(cropData.y);
    const width = Math.min(previewImage.naturalWidth - x, Math.round(cropData.width));
    const height = Math.min(previewImage.naturalHeight - y, Math.round(cropData.height));

    return { height, width, x, y };
  };

  const handleComplete = async () => {
    if (!cropperRef.current) {
      return;
    }

    let { height, width, x, y } = getDimensionFromCropper();
    const { height: resizedH, width: resizedW } = historyRef.current[0].dimension;
    const { x: currentX, y: currentY } = historyRef.current[historyRef.current.length - 1].dimension;
    const { height: originalHeight, width: originalWidth } = originalSizeRef.current;
    const ratio = originalWidth > originalHeight ? originalWidth / resizedW : originalHeight / resizedH;

    x += currentX;
    y += currentY;
    x = Math.floor(x * ratio);
    y = Math.floor(y * ratio);
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);

    if (width === originalWidth && height === originalHeight) {
      onClose();

      return;
    }

    progressCaller.openNonstopProgress({ id: 'photo-edit-processing', message: t.processing });

    const result = await jimpHelper.cropImage(src, x, y, width, height);
    const base64 = await calculateBase64(result, isShading, threshold, isFullColor);
    const elemW = Number.parseFloat(image.getAttribute('width'));
    const elemH = Number.parseFloat(image.getAttribute('height'));
    const newX = Number.parseFloat(image.getAttribute('x')) + (x / originalWidth) * elemW;
    const newY = Number.parseFloat(image.getAttribute('y')) + (y / originalHeight) * elemH;
    const newWidth = (elemW * width) / originalWidth;
    const newHeight = (elemH * height) / originalHeight;

    handleFinish(image, result, base64, { height: newHeight, width: newWidth, x: newX, y: newY });
    progressCaller.popById('photo-edit-processing');
    onClose();
  };

  const { blobUrl } = state;
  const handleApply = async () => {
    if (!cropperRef.current) {
      return;
    }

    const { height, width, x, y } = getDimensionFromCropper();
    const previewImage = previewImageRef.current;

    if (x === 0 && y === 0 && width === previewImage.naturalWidth && height === previewImage.naturalHeight) {
      return;
    }

    progressCaller.openNonstopProgress({ id: 'photo-edit-processing', message: t.processing });

    const result = await jimpHelper.cropImage(blobUrl, x, y, width, height);

    if (result) {
      const displayBase64 = await calculateBase64(result, isShading, threshold, isFullColor);
      const { dimension } = historyRef.current[historyRef.current.length - 1];

      historyRef.current.push({
        blobUrl: result,
        dimension: {
          height,
          width,
          x: dimension.x + x,
          y: dimension.y + y,
        },
      });
      setState({ ...state, blobUrl: result, displayBase64, height, width });
    }

    progressCaller.popById('photo-edit-processing');
  };

  const handleUndo = async () => {
    if (historyRef.current.length === 1) {
      return;
    }

    progressCaller.openNonstopProgress({ id: 'photo-edit-processing', message: t.processing });

    const { blobUrl: currentUrl } = historyRef.current.pop();

    URL.revokeObjectURL(currentUrl);

    const { blobUrl: newUrl, dimension } = historyRef.current[historyRef.current.length - 1];
    const { height, width } = dimension;
    const displayBase64 = await calculateBase64(newUrl, isShading, threshold, isFullColor);

    setState({ ...state, blobUrl: newUrl, displayBase64, height, width });
    progressCaller.popById('photo-edit-processing');
  };

  const [cancelBtn, backBtn, applyBtn, okBtn] = [
    <Button key="cancel" onClick={onClose}>
      {tGlobal.cancel}
    </Button>,
    <Button disabled={historyRef.current.length <= 1} key="back" onClick={handleUndo}>
      {tGlobal.back}
    </Button>,
    <Button key="apply" onClick={handleApply}>
      {tGlobal.apply}
    </Button>,
    <Button key="ok" onClick={handleComplete} type="primary">
      {tGlobal.ok}
    </Button>,
  ];
  const { displayBase64, height, width } = state;
  const maxWidth = window.innerWidth - MODAL_PADDING_X;
  const maxHieght = window.innerHeight - MODAL_PADDING_Y;
  const isWideImage = width / maxWidth > height / maxHieght;
  const isMobile = useIsMobile();

  return (
    <ConfigProvider
      theme={isMobile ? { components: { Button: { borderRadius: 100 }, Select: { borderRadius: 100 } } } : undefined}
    >
      <Modal
        centered
        footer={isMobile ? [cancelBtn, okBtn] : [cancelBtn, backBtn, applyBtn, okBtn]}
        maskClosable={false}
        onCancel={onClose}
        open
        title={t.crop}
        width={isWideImage ? maxWidth : undefined}
      >
        {isMobile && (
          <div className={styles['top-buttons']}>
            {backBtn}
            {applyBtn}
          </div>
        )}
        <img
          onLoad={() => startCropper()}
          ref={previewImageRef}
          src={displayBase64}
          style={isWideImage ? { width: `${maxWidth}px` } : { height: `${maxHieght}px` }}
        />
        {isMobile && (
          <div className={styles.field}>
            <span className={styles.label}>{t.aspect_ratio}</span>
            <Select
              className={styles.select}
              onChange={(val) => {
                startCropper(val === 0 ? state.imgAspectRatio : val);
                setState({ ...state, aspectRatio: val });
              }}
              options={[
                { label: '1:1', value: 1 },
                { label: t.original, value: 0 },
                { label: t.free, value: Number.NaN },
                { label: '16:9', value: 16 / 9 },
                { label: '4:3', value: 4 / 3 },
              ]}
              value={state.aspectRatio}
            />
          </div>
        )}
      </Modal>
    </ConfigProvider>
  );
};

export default CropPanel;
