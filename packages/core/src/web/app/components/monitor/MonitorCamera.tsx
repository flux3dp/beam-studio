import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'classnames';

import DeviceMaster from '@core/helpers/device-master';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const hdChecked: { [key: string]: number } = {};

const getImageSize = (url: string, onSize: (size: number[]) => void) => {
  const img = new Image();

  img.onload = () => {
    onSize([img.naturalWidth, img.naturalHeight]);
  };
  img.src = url;
};

interface MonitorCameraProps {
  device: IDeviceInfo;
}

const MonitorCamera = ({ device }: MonitorCameraProps): React.JSX.Element => {
  const [isHd, setIsHd] = useState(false);

  const isBeamboxCamera = useMemo(
    () => ['darwin-dev', 'fbb1b', 'fbb1p', 'fbm1', 'fhexa1', 'laser-b1', 'laser-b2', 'mozu1'].includes(device.model),
    [device.model],
  );

  const deviceRef = useRef(device);

  deviceRef.current = device;

  const processImage = useCallback(({ imgBlob }: { imgBlob: Blob }) => {
    const cameraImage = document.getElementById('camera-image');

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
      cameraStream = await DeviceMaster.streamCamera();
      cameraStream.subscribe(processImage);
    };

    startCamera();

    return () => {
      DeviceMaster.disconnectCamera();
    };
  }, [processImage]);

  const className = classNames('camera-image', {
    'beambox-camera': isBeamboxCamera,
    hd: isHd,
  });

  return (
    <div className="camera">
      <img className={className} id="camera-image" />
    </div>
  );
};

export default MonitorCamera;
