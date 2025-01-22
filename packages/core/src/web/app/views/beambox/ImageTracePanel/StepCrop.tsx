import React, { useEffect, useRef, useState } from 'react';

import { Modal, Spin } from 'antd';
import Cropper from 'cropperjs';

import PreviewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import i18n from '@core/helpers/i18n';

const LANG = i18n.lang.beambox.image_trace_panel;

interface Props {
  onCancel: () => void;
  onCropFinish: (data: Cropper.Data, url: string) => void;
}

const MODAL_PADDING_X = 80;
const MODAL_PADDING_Y = 170;

const StepCrop = ({ onCancel, onCropFinish }: Props): React.JSX.Element => {
  const [croppedCameraCanvasBlobUrl, setCroppedCameraCanvasBlobUrl] = useState('');

  useEffect(() => () => URL.revokeObjectURL(croppedCameraCanvasBlobUrl), [croppedCameraCanvasBlobUrl]);

  const cropperRef = useRef<Cropper>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);

  const { maxX, maxY, minX, minY } = PreviewModeBackgroundDrawer.getCoordinates();
  const width = maxX - minX;
  const height = maxY - minY;

  useEffect(() => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      canvas.width = width;
      canvas.height = height;
      context.drawImage(img, minX, minY, width, height, 0, 0, width, height);
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);

        setCroppedCameraCanvasBlobUrl(url);
      });
    };
    img.src = PreviewModeBackgroundDrawer.getCameraCanvasUrl();

    return () => {
      cropperRef.current?.destroy();
    };
    // eslint-disable-next-line hooks/exhaustive-deps
  }, []);

  const startCropper = () => {
    if (!previewImageRef.current) {
      return;
    }

    cropperRef.current = new Cropper(previewImageRef.current, {
      viewMode: 2,
      zoomable: false,
    });
  };

  const handleCrop = () => {
    if (!cropperRef.current) {
      return;
    }

    const cropper = cropperRef.current;
    const cropData = cropper.getData();
    const croppedCanvas = cropper.getCroppedCanvas();

    croppedCanvas.toBlob((blob) => {
      const croppedBlobUrl = URL.createObjectURL(blob);

      onCropFinish(cropData, croppedBlobUrl);
    });
  };

  const maxWidth = window.innerWidth - MODAL_PADDING_X;
  const maxHieght = window.innerHeight - MODAL_PADDING_Y;
  const isWideImage = width / maxWidth > height / maxHieght;

  return (
    <Modal
      centered
      closable={false}
      maskClosable={false}
      okText={LANG.next}
      onCancel={onCancel}
      onOk={handleCrop}
      open
      width={isWideImage ? maxWidth : undefined}
    >
      {croppedCameraCanvasBlobUrl === '' ? (
        <Spin />
      ) : (
        <div>
          <img
            onLoad={startCropper}
            ref={previewImageRef}
            src={croppedCameraCanvasBlobUrl}
            style={isWideImage ? { width: `${maxWidth}px` } : { height: `${maxHieght}px` }}
          />
        </div>
      )}
    </Modal>
  );
};

export default StepCrop;
