const React = requireNode('react');
const classNames = requireNode('classnames');

import { MonitorContext } from 'app/contexts/Monitor-Context';
import RawMovePanel from 'app/widgets/Raw-Move-Panel';
import DeviceMaster from 'helpers/device-master';

const hdChecked = {};

const getImageSize = (url: string, onSize: (size: number[]) => void) => {
    var img = new Image();
    img.onload = () => {
        onSize([img.naturalWidth, img.naturalHeight]);
    };
    img.src = url;
};

export default class MonitorRelocate extends React.PureComponent {
    constructor(props) {
        super(props);
        this.isBeamboxCamera = ['mozu1', 'fbm1', 'fbb1b', 'fbb1p', 'fbb2b', 'laser-b1', 'darwin-dev'].includes(this.props.device.model);
        this.state = {
            isHd: false,
            currentPosition: {
                x: 0,
                y: 0,
            },
        };
    }

    async componentDidMount() {
        this.cameraStream = await DeviceMaster.streamCamera(false);
        this.cameraStream.subscribe(this.processImage);
    }

    componentWillUnmount() {
        DeviceMaster.endRawMode();
        DeviceMaster.disconnectCamera();
    }

    processImage = ({ imgBlob }: { imgBlob: Blob }) => {
        const { device } = this.props;
        const cameraImage = document.getElementById('camera-image');
        if (!cameraImage) return;

        let url = URL.createObjectURL(imgBlob);
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
    }

    renderOriginMark = () => {
        const { cameraOffset, currentPosition } = this.context;
        const cameraStreamImg = this.refs.cameraStreamImg;
        if (!cameraStreamImg || !cameraOffset) {
            return;
        }
        const x = currentPosition.x + cameraOffset.x;
        const y = currentPosition.y + cameraOffset.y;
        const imageScale = cameraStreamImg.width / cameraStreamImg.naturalWidth;
        let dx = x * 10 * imageScale / cameraOffset.scaleRatioX;
        let dy = y * 10 * imageScale / cameraOffset.scaleRatioY;
        if (dx > 100) {
            // compensation when x is too large, calculated by regression
            let compensationX = ((dx - 100) / 100) ^ 2 + 3.9 * ((dx - 100) / 100) + 0.95;
            dx -= compensationX;
        }
        const centerX = cameraStreamImg.width / 2 - dx;
        const centerY = cameraStreamImg.height / 2 - dy;
        if (centerX < 0 || centerY < 0) {
            return null;
        }
        return (
            <div className="origin-mark-wrapper" style={{left: centerX, top: centerY}}>
                <div className="bars bar1 shadow"></div>
                <div className="bars bar2 shadow"></div>
                <div className="bars bar1"></div>
            </div>
        );
    }

    renderRelocateOrigin = () => {
        const { cameraOffset, currentPosition } = this.context;
        const cameraStreamImg = this.refs.cameraStreamImg;
        if (!cameraStreamImg || !cameraOffset) {
            return;
        }
        const imageScale = cameraStreamImg.width / cameraStreamImg.naturalWidth;
        const dx = cameraOffset.x * 10 * imageScale / cameraOffset.scaleRatioX;
        const dy = cameraOffset.y * 10 * imageScale / cameraOffset.scaleRatioY;
        const centerX = cameraStreamImg.width / 2 - dx;
        const centerY = cameraStreamImg.height / 2 - dy;
        return (
            <div className="relocate-origin-mark-wrapper" style={{left: centerX, top: centerY}}>
                <div className="bars bar1 shadow"></div>
                <div className="bars bar2 shadow"></div>
                <div className="bars bar1"></div>
                <div className="relocate-origin">
                    {`${currentPosition.x}, ${currentPosition.y}`}
                </div>
            </div>
        );
    }

    handleMoveStart = () => {
        const { onMaintainMoveStart } = this.context;
        onMaintainMoveStart();
    }

    handleMoveEnd = (x, y) => {
        const { onMaintainMoveEnd } = this.context;
        x = Math.round(x * 10) / 10;
        y = Math.round(y * 10) / 10;
        onMaintainMoveEnd(x, y);
    }

    render() {
        const { isHd } = this.state;
        const className = classNames('camera-image', { 'beambox-camera': this.isBeamboxCamera, hd: isHd });

        return(
            <div className="camera-relocate-container">
                <div className="img-container">
                    <img id={'camera-image'} className={className} ref='cameraStreamImg'/>
                </div>
                {this.renderOriginMark()}
                {this.renderRelocateOrigin()}
                <RawMovePanel
                    onMoveStart={this.handleMoveStart}
                    onMoveEnd={this.handleMoveEnd}
                />
            </div>
        );
    }
}

MonitorRelocate.contextType = MonitorContext;
