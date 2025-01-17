import React, { useEffect, useMemo, useRef, useState } from 'react';
import Cropper from 'cropperjs';
import { Button, ConfigProvider, Modal } from 'antd';

import calculateBase64 from 'helpers/image-edit-panel/calculate-base64';
import handleFinish from 'helpers/image-edit-panel/handle-finish';
import jimpHelper from 'helpers/jimp-helper';
import progressCaller from 'app/actions/progress-caller';
import Select from 'app/widgets/AntdSelect';
import useI18n from 'helpers/useI18n';
import { CropperDimension, preprocessByUrl } from 'helpers/image-edit-panel/preprocess';
import { useIsMobile } from 'helpers/system-helper';

import styles from './CropPanel.module.scss';

interface Props {
  src: string;
  image: SVGImageElement;
  onClose: () => void;
}

interface HistoryItem {
  dimension: CropperDimension;
  blobUrl: string;
}

const MODAL_PADDING_X = 80;
const MODAL_PADDING_Y = 170;

const CropPanel = ({ src, image, onClose }: Props): JSX.Element => {
  const {
    beambox: { photo_edit_panel: t },
    global: tGlobal,
  } = useI18n();
  const cropperRef = useRef<Cropper>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);
  const originalSizeRef = useRef({ width: 0, height: 0 });
  const historyRef = useRef<HistoryItem[]>([]);
  const { isShading, threshold, isFullColor } = useMemo(
    () => ({
      isShading: image.getAttribute('data-shading') === 'true',
      threshold: parseInt(image.getAttribute('data-threshold'), 10),
      isFullColor: image.getAttribute('data-fullcolor') === '1',
    }),
    [image]
  );
  const [state, setState] = useState({
    blobUrl: src,
    displayBase64: '',
    width: 0,
    height: 0,
    aspectRatio: NaN,
    imgAspectRatio: NaN,
  });

  const preprocess = async () => {
    progressCaller.openNonstopProgress({ id: 'photo-edit-processing', message: t.processing });

    const { blobUrl, dimension, originalWidth, originalHeight } = await preprocessByUrl(src);
    const { width, height } = dimension;

    originalSizeRef.current = { width: originalWidth, height: originalHeight };
    historyRef.current.push({ dimension, blobUrl });

    const displayBase64 = await calculateBase64(blobUrl, isShading, threshold, isFullColor);
    setState({
      blobUrl,
      displayBase64,
      width,
      height,
      aspectRatio: NaN,
      imgAspectRatio: width / height,
    });
    progressCaller.popById('photo-edit-processing');
  };

  const cleanUpHistory = () => {
    for (let i = 0; i < historyRef.current.length; i += 1) {
      const { blobUrl } = historyRef.current[i];
      if (blobUrl !== src) URL.revokeObjectURL(blobUrl);
    }
  };

  useEffect(() => {
    preprocess();
    return () => {
      cleanUpHistory();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCropper = (aspectRatio = NaN) => {
    if (cropperRef.current) cropperRef.current.destroy();
    cropperRef.current = new Cropper(previewImageRef.current, {
      aspectRatio,
      autoCropArea: 1,
      zoomable: false,
      viewMode: 2,
      minCropBoxWidth: 1,
      minCropBoxHeight: 1,
    });
  };

  const getDimensionFromCropper = () => {
    const cropData = cropperRef.current.getData();
    const previewImage = previewImageRef.current;
    const x = Math.round(cropData.x);
    const y = Math.round(cropData.y);
    const width = Math.min(previewImage.naturalWidth - x, Math.round(cropData.width));
    const height = Math.min(previewImage.naturalHeight - y, Math.round(cropData.height));
    return { x, y, width, height };
  };

  const handleComplete = async () => {
    if (!cropperRef.current) return;
    let { x, y, width, height } = getDimensionFromCropper();
    const { width: resizedW, height: resizedH } = historyRef.current[0].dimension;
    const { x: currentX, y: currentY } =
      historyRef.current[historyRef.current.length - 1].dimension;
    const { width: originalWidth, height: originalHeight } = originalSizeRef.current;
    const ratio =
      originalWidth > originalHeight ? originalWidth / resizedW : originalHeight / resizedH;
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
    const elemW = parseFloat(image.getAttribute('width'));
    const elemH = parseFloat(image.getAttribute('height'));
    const newX = parseFloat(image.getAttribute('x')) + (x / originalWidth) * elemW;
    const newY = parseFloat(image.getAttribute('y')) + (y / originalHeight) * elemH;
    const newWidth = (elemW * width) / originalWidth;
    const newHeight = (elemH * height) / originalHeight;
    handleFinish(image, result, base64, { width: newWidth, height: newHeight, x: newX, y: newY });
    progressCaller.popById('photo-edit-processing');
    onClose();
  };

  const { blobUrl } = state;
  const handleApply = async () => {
    if (!cropperRef.current) return;
    const { x, y, width, height } = getDimensionFromCropper();
    const previewImage = previewImageRef.current;
    if (
      x === 0 &&
      y === 0 &&
      width === previewImage.naturalWidth &&
      height === previewImage.naturalHeight
    )
      return;
    progressCaller.openNonstopProgress({ id: 'photo-edit-processing', message: t.processing });
    const result = await jimpHelper.cropImage(blobUrl, x, y, width, height);
    if (result) {
      const displayBase64 = await calculateBase64(result, isShading, threshold, isFullColor);
      const { dimension } = historyRef.current[historyRef.current.length - 1];
      historyRef.current.push({
        blobUrl: result,
        dimension: {
          x: dimension.x + x,
          y: dimension.y + y,
          width,
          height,
        },
      });
      setState({ ...state, blobUrl: result, displayBase64, width, height });
    }
    progressCaller.popById('photo-edit-processing');
  };

  const handleUndo = async () => {
    if (historyRef.current.length === 1) return;
    progressCaller.openNonstopProgress({ id: 'photo-edit-processing', message: t.processing });
    const { blobUrl: currentUrl } = historyRef.current.pop();
    URL.revokeObjectURL(currentUrl);
    const { blobUrl: newUrl, dimension } = historyRef.current[historyRef.current.length - 1];
    const { width, height } = dimension;
    const displayBase64 = await calculateBase64(newUrl, isShading, threshold, isFullColor);
    setState({ ...state, blobUrl: newUrl, displayBase64, width, height });
    progressCaller.popById('photo-edit-processing');
  };

  const [cancelBtn, backBtn, applyBtn, okBtn] = [
    <Button key="cancel" onClick={onClose}>
      {tGlobal.cancel}
    </Button>,
    <Button key="back" onClick={handleUndo} disabled={historyRef.current.length <= 1}>
      {tGlobal.back}
    </Button>,
    <Button key="apply" onClick={handleApply}>
      {tGlobal.apply}
    </Button>,
    <Button key="ok" type="primary" onClick={handleComplete}>
      {tGlobal.ok}
    </Button>,
  ];
  const { width, height, displayBase64 } = state;
  const maxWidth = window.innerWidth - MODAL_PADDING_X;
  const maxHieght = window.innerHeight - MODAL_PADDING_Y;
  const isWideImage = width / maxWidth > height / maxHieght;
  const isMobile = useIsMobile();

  return (
    <ConfigProvider
      theme={
        isMobile
          ? { components: { Button: { borderRadius: 100 }, Select: { borderRadius: 100 } } }
          : undefined
      }
    >
      <Modal
        open
        centered
        maskClosable={false}
        title={t.crop}
        width={isWideImage ? maxWidth : undefined}
        onCancel={onClose}
        footer={isMobile ? [cancelBtn, okBtn] : [cancelBtn, backBtn, applyBtn, okBtn]}
      >
        {isMobile && (
          <div className={styles['top-buttons']}>
            {backBtn}
            {applyBtn}
          </div>
        )}
        <img
          ref={previewImageRef}
          src={displayBase64}
          style={isWideImage ? { width: `${maxWidth}px` } : { height: `${maxHieght}px` }}
          onLoad={() => startCropper()}
        />
        {isMobile && (
          <div className={styles.field}>
            <span className={styles.label}>{t.aspect_ratio}</span>
            <Select
              className={styles.select}
              value={state.aspectRatio}
              onChange={(val) => {
                startCropper(val === 0 ? state.imgAspectRatio : val);
                setState({ ...state, aspectRatio: val });
              }}
              options={[
                { label: '1:1', value: 1 },
                { label: t.original, value: 0 },
                { label: t.free, value: NaN },
                { label: '16:9', value: 16 / 9 },
                { label: '4:3', value: 4 / 3 },
              ]}
            />
          </div>
        )}
      </Modal>
    </ConfigProvider>
  );
};

export default CropPanel;
