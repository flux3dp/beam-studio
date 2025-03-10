import React from 'react';

import classNames from 'classnames';

import { MonitorContext } from '@core/app/contexts/MonitorContext';
import RawMovePanel from '@core/app/widgets/Raw-Move-Panel';
import DeviceMaster from '@core/helpers/device-master';
import type { IDeviceInfo } from '@core/interfaces/IDevice';

const hdChecked = {};

const getImageSize = (url: string, onSize: (size: number[]) => void) => {
  const img = new Image();

  img.onload = () => {
    onSize([img.naturalWidth, img.naturalHeight]);
  };
  img.src = url;
};

interface Props {
  device: IDeviceInfo;
}

interface State {
  isHd: boolean;
}

export default class MonitorRelocate extends React.PureComponent<Props, State> {
  private isBeamboxCamera: boolean;

  private cameraStream: any;

  private imgRef: React.RefObject<HTMLImageElement>;

  constructor(props: Props) {
    super(props);
    this.isBeamboxCamera = ['darwin-dev', 'fbb1b', 'fbb1p', 'fbm1', 'fhexa1', 'laser-b1', 'laser-b2', 'mozu1'].includes(
      props.device.model,
    );
    this.state = {
      isHd: false,
    };
    this.imgRef = React.createRef();
  }

  async componentDidMount() {
    this.cameraStream = await DeviceMaster.streamCamera(false);
    this.cameraStream.subscribe(this.processImage);
  }

  componentWillUnmount() {
    DeviceMaster.endSubTask();
    DeviceMaster.disconnectCamera();
  }

  processImage = ({ imgBlob }: { imgBlob: Blob }) => {
    const { device } = this.props;
    const cameraImage = this.imgRef.current;

    if (!cameraImage) {
      return;
    }

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

  renderOriginMark = () => {
    const { cameraOffset, currentPosition } = this.context;
    const cameraStreamImg = this.imgRef.current;

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

  renderRelocateOrigin = () => {
    const { cameraOffset, currentPosition } = this.context;
    const cameraStreamImg = this.imgRef.current;

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

  handleMoveStart = () => {
    const { onMaintainMoveStart } = this.context;

    onMaintainMoveStart();
  };

  handleMoveEnd = (x, y) => {
    const { onMaintainMoveEnd } = this.context;

    x = Math.round(x * 10) / 10;
    y = Math.round(y * 10) / 10;
    onMaintainMoveEnd(x, y);
  };

  render() {
    const { isHd } = this.state;
    const className = classNames('camera-image', {
      'beambox-camera': this.isBeamboxCamera,
      hd: isHd,
    });

    return (
      <div className="camera-relocate-container">
        <div className="img-container">
          <img className={className} id="camera-image" ref={this.imgRef} />
        </div>
        {this.renderOriginMark()}
        {this.renderRelocateOrigin()}
        <RawMovePanel onMoveEnd={this.handleMoveEnd} onMoveStart={this.handleMoveStart} />
      </div>
    );
  }
}

MonitorRelocate.contextType = MonitorContext;
