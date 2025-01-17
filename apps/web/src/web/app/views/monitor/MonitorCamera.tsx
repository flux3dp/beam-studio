import React from 'react';
import classNames from 'classnames';

import { MonitorContext } from 'app/contexts/MonitorContext';
import DeviceMaster from 'helpers/device-master';
import { IDeviceInfo } from 'interfaces/IDevice';

const hdChecked = {};

const getImageSize = (url: string, onSize: (size: number[]) => void) => {
  const img = new Image();
  img.onload = () => {
    onSize([img.naturalWidth, img.naturalHeight]);
  };
  img.src = url;
};

interface Props {
  device: IDeviceInfo,
}

interface State {
  isHd: boolean,
}

export default class MonitorCamera extends React.PureComponent<Props, State> {
  private isBeamboxCamera: boolean;

  private cameraStream: any;

  private previewBlob: Blob;

  constructor(props) {
    super(props);
    const { device } = this.props;
    const { model } = device;
    this.isBeamboxCamera = [
      'mozu1',
      'fbm1',
      'fbb1b',
      'fbb1p',
      'fhexa1',
      'laser-b1',
      'laser-b2',
      'darwin-dev',
    ].includes(model);
    this.state = {
      isHd: false,
    };
  }

  async componentDidMount() {
    this.cameraStream = await DeviceMaster.streamCamera();
    this.cameraStream.subscribe(this.processImage);
  }

  componentWillUnmount() {
    DeviceMaster.disconnectCamera();
  }

  processImage = ({ imgBlob }: { imgBlob: Blob }) => {
    const { device } = this.props;
    const cameraImage = document.getElementById('camera-image');
    if (!cameraImage) return;

    const url = URL.createObjectURL(imgBlob);
    if (device) {
      if (!hdChecked[device.serial]) {
        getImageSize(url, (size: number[]) => {
          console.log('image size', size);
          if (size[0] > 720) {
            hdChecked[device.serial] = 2;
          } else if (size[0] > 0) {
            hdChecked[device.serial] = 1;
          }
        });
      }

      this.setState({ isHd: hdChecked[device.serial] !== 1 });
    }
    this.previewBlob = imgBlob;
    const originalUrl = cameraImage.getAttribute('src');
    if (originalUrl) {
      URL.revokeObjectURL(originalUrl);
    }
    cameraImage.setAttribute('src', url);
  };

  render() {
    const { isHd } = this.state;
    const className = classNames('camera-image', { 'beambox-camera': this.isBeamboxCamera, hd: isHd });
    return (
      <div className="camera">
        <img id="camera-image" className={className} />
      </div>
    );
  }
}

MonitorCamera.contextType = MonitorContext;
