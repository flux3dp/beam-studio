import React, { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'classnames';

import { MonitorContext } from '@core/app/contexts/MonitorContext';
import RawMovePanel from '@core/app/widgets/Raw-Move-Panel';
import DeviceMaster from '@core/helpers/device-master';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const hdChecked: Record<string, number> = {};

const getImageSize = (url: string, onSize: (size: number[]) => void) => {
  const img = new Image();

  img.onload = () => {
    onSize([img.naturalWidth, img.naturalHeight]);
  };
  img.src = url;
};

interface MonitorRelocateProps {
  device: IDeviceInfo;
}

const MonitorRelocate = ({ device }: MonitorRelocateProps): React.JSX.Element => {
  const [isHd, setIsHd] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const { cameraOffset, currentPosition, onMaintainMoveEnd, onMaintainMoveStart } = use(MonitorContext);

  const isBeamboxCamera = useMemo(
    () => ['darwin-dev', 'fbb1b', 'fbb1p', 'fbm1', 'fhexa1', 'laser-b1', 'laser-b2', 'mozu1'].includes(device.model),
    [device.model],
  );

  const deviceRef = useRef(device);

  deviceRef.current = device;

  const processImage = useCallback(({ imgBlob }: { imgBlob: Blob }) => {
    const cameraImage = imgRef.current;

    if (!cameraImage) {
      return;
    }

    const url = URL.createObjectURL(imgBlob);
    const currentDevice = deviceRef.current;

    if (currentDevice) {
      if (!hdChecked[currentDevice.serial]) {
        getImageSize(url, (size: number[]) => {
          console.log('image size', size);

          if (size[0] > 720) {
            hdChecked[currentDevice.serial] = 2;
          } else if (size[0] > 0) {
            hdChecked[currentDevice.serial] = 1;
          }
        });
      }

      setIsHd(hdChecked[currentDevice.serial] !== 1);
    }

    const originalUrl = cameraImage.getAttribute('src');

    if (originalUrl) {
      URL.revokeObjectURL(originalUrl);
    }

    cameraImage.setAttribute('src', url);
  }, []);

  useEffect(() => {
    let cameraStream: any;

    const startCamera = async () => {
      cameraStream = await DeviceMaster.streamCamera(false);
      cameraStream.subscribe(processImage);
    };

    startCamera();

    return () => {
      DeviceMaster.endSubTask();
      DeviceMaster.disconnectCamera();
    };
  }, [processImage]);

  const handleMoveStart = useCallback(() => {
    onMaintainMoveStart();
  }, [onMaintainMoveStart]);

  const handleMoveEnd = useCallback(
    (x: number, y: number) => {
      onMaintainMoveEnd(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
    },
    [onMaintainMoveEnd],
  );

  const renderOriginMark = () => {
    const cameraStreamImg = imgRef.current;

    if (!cameraStreamImg || !cameraOffset) {
      return null;
    }

    const x = currentPosition.x + cameraOffset.x;
    const y = currentPosition.y + cameraOffset.y;
    const imageScale = cameraStreamImg.width / cameraStreamImg.naturalWidth;
    let dx = (x * 10 * imageScale) / cameraOffset.scaleRatioX;
    const dy = (y * 10 * imageScale) / cameraOffset.scaleRatioY;

    if (dx > 100) {
      // compensation when x is too large, calculated by regression
      const compensationX = ((dx - 100) / 100) ^ (2 + 3.9 * ((dx - 100) / 100) + 0.95);

      dx -= compensationX;
    }

    const centerX = cameraStreamImg.width / 2 - dx;
    const centerY = cameraStreamImg.height / 2 - dy;

    if (centerX < 0 || centerY < 0) {
      return null;
    }

    return (
      <div className="origin-mark-wrapper" style={{ left: centerX, top: centerY }}>
        <div className="bars bar1 shadow" />
        <div className="bars bar2 shadow" />
        <div className="bars bar1" />
      </div>
    );
  };

  const renderRelocateOrigin = () => {
    const cameraStreamImg = imgRef.current;

    if (!cameraStreamImg || !cameraOffset) {
      return null;
    }

    const imageScale = cameraStreamImg.width / cameraStreamImg.naturalWidth;
    const dx = (cameraOffset.x * 10 * imageScale) / cameraOffset.scaleRatioX;
    const dy = (cameraOffset.y * 10 * imageScale) / cameraOffset.scaleRatioY;
    const centerX = cameraStreamImg.width / 2 - dx;
    const centerY = cameraStreamImg.height / 2 - dy;

    return (
      <div className="relocate-origin-mark-wrapper" style={{ left: centerX, top: centerY }}>
        <div className="bars bar1 shadow" />
        <div className="bars bar2 shadow" />
        <div className="bars bar1" />
        <div className="relocate-origin">{`${currentPosition.x}, ${currentPosition.y}`}</div>
      </div>
    );
  };

  const className = classNames('camera-image', {
    'beambox-camera': isBeamboxCamera,
    hd: isHd,
  });

  return (
    <div className="camera-relocate-container">
      <div className="img-container">
        <img className={className} id="camera-image" ref={imgRef} />
      </div>
      {renderOriginMark()}
      {renderRelocateOrigin()}
      <RawMovePanel onMoveEnd={handleMoveEnd} onMoveStart={handleMoveStart} />
    </div>
  );
};

export default MonitorRelocate;
