const React = requireNode('react');
const classNames = requireNode('classnames');

import { MonitorContext } from 'app/contexts/Monitor-Context';
import DeviceMaster from 'helpers/device-master';
import i18n from 'helpers/i18n';

const hdChecked = {};

const getImageSize = (url: string, onSize: (size: number[]) => void) => {
    var img = new Image();
    img.onload = () => {
        onSize([img.naturalWidth, img.naturalHeight]);
    };
    img.src = url;
};

export default class MonitorCamera extends React.PureComponent {
    constructor(props) {
        super(props);
        this.isBeamboxCamera = ['mozu1', 'fbm1', 'fbb1b', 'fbb1p', 'fbb2b', 'laser-b1', 'darwin-dev'].includes(this.props.device.model);
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

    render() {
        const { isHd } = this.state;
        const className = classNames('camera-image', { 'beambox-camera': this.isBeamboxCamera, hd: isHd });
        return (
            <div className='camera'> 
                <img id={'camera-image'} className={className}/>
            </div>
        );
    }
}

MonitorCamera.contextType = MonitorContext;
