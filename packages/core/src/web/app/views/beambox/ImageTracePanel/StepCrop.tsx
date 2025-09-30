import React, { useEffect, useRef, useState } from 'react';

import { Modal, Spin } from 'antd';
import Cropper from 'cropperjs';

import PreviewModeBackgroundDrawer from '@core/app/actions/beambox/preview-mode-background-drawer';
import useI18n from '@core/helpers/useI18n';

interface Props {
  onCancel: () => void;
  onCropFinish: (data: Cropper.Data, url: string) => void;
}

const MODAL_PADDING_X = 80;
const MODAL_PADDING_Y = 170;

const StepCrop = ({ onCancel, onCropFinish }: Props): React.JSX.Element => {
  const lang = useI18n().beambox.image_trace_panel;
  const [croppedCameraCanvasBlobUrl, setCroppedCameraCanvasBlobUrl] = useState('');

  useEffect(() => () => URL.revokeObjectURL(croppedCameraCanvasBlobUrl), [croppedCameraCanvasBlobUrl]);

  const cropperRef = useRef<Cropper | null>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);

  const { maxX, maxY, minX, minY } = PreviewModeBackgroundDrawer.getCoordinates();
  const width = maxX - minX;
  const height = maxY - minY;

  useEffect(() => {
    const initImage = async () => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;

        canvas.width = width;
        canvas.height = height;
        context.drawImage(img, minX, minY, width, height, 0, 0, width, height);
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob!);

          setCroppedCameraCanvasBlobUrl(url);
        });
      };
      img.src = await PreviewModeBackgroundDrawer.getCameraCanvasUrl();
    };

    initImage();

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
  const maxHeight = window.innerHeight - MODAL_PADDING_Y;
  const isWideImage = width / maxWidth > height / maxHeight;

  return (
    <Modal
      centered
      closable={false}
      maskClosable={false}
      okText={lang.next}
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
            style={isWideImage ? { width: `${maxWidth}px` } : { height: `${maxHeight}px` }}
          />
        </div>
      )}
    </Modal>
  );
};

export default StepCrop;
