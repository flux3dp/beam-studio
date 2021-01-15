import ElectronDialogs from '../../actions/electron-dialogs';
import MonitorActionCreator from '../../action-creators/monitor';
import GlobalConstants from '../../constants/global-constants';
import DeviceConstants from '../../constants/device-constants';
import DeviceMaster from '../../../helpers/device-master';
import FormatDuration from '../../../helpers/duration-formatter';
import RawMovePanel from '../../widgets/Raw-Move-Panel';
import VersionChecker from '../../../helpers/version-checker';

const React = requireNode('react');
const ClassNames = requireNode('classnames');
const defaultImage = 'img/ph_l.png';
const maxFileNameLength = 12;

let selectedItem = '',
    previewUrl = defaultImage,
    previewBlob = null,
    hdChecked = {};

const findObjectContainsProperty = (infoArray = [], propertyName) => {
    return infoArray.filter((o) => Object.keys(o).some(n => n === propertyName));
};

const getImageSize = (url, onSize) => {
    var img = new Image();
    img.onload = () => {
        onSize([img.naturalWidth, img.naturalHeight]);
    };
    img.src = url;
};

class MonitorDisplay extends React.Component{
    constructor(props) {
        super(props);
        const { store } = this.props.context;

        this.unsubscribe = store.subscribe(() => {
            this.forceUpdate();
        });
        this.state = {
            isHd: false
        };
    }

    UNSAFE_componentWillUpdate() {
        return false;
    }

    componentWillUnmount() {
        previewUrl = '';
        this.unsubscribe();
    }

    _getPreviewUrl = () => {
        let { Monitor, Device } = this.props.context.store.getState();
        const setUrl = (info) => {
            let blobIndex = info.findIndex(o => o instanceof Blob);
            previewUrl = blobIndex > 0 ? window.URL.createObjectURL(info[blobIndex]) : defaultImage;
        };

        if(previewUrl === defaultImage || !previewUrl) {
            if(Monitor.mode === GlobalConstants.FILE_PREVIEW) {
                setUrl(Monitor.selectedFileInfo);
            }
            else if(Device.jobInfo.length > 0) {
                setUrl(Device.jobInfo);
            }
            else {
                previewUrl = this.props.previewUrl;
            }
        }

        if(!previewUrl) {
            return '';
        }
        return `url(${previewUrl})`;
    }

    _showPreview = () => {
        let divStyle = {
            borderRadius: '2px',
            backgroundColor: '#F0F0F0',
            backgroundImage: this._getPreviewUrl(),
            backgroundSize: '100% auto',
            backgroundPosition: '50% 50%',
            backgroundRepeatY: 'no-repeat',
            width: '100%',
            height: '100%'
        };

        return (<div style={divStyle} />);
    }

    _imageError = (src) => {
        src.target.src = 'img/ph_s.png';
    }

    _listFolderContent = () => {
        let { Monitor, Device } = this.props.context.store.getState();
        let { files, directories } = Monitor.currentFolderContent;
        previewUrl = defaultImage; // reset preview image

        if(!directories || !files) {
            return;
        }

        // console.log(directories);

        let _folders = directories.map((folder) => {
            let folderNameClass = ClassNames('name', {'selected': Monitor.selectedItem.name === folder});
            return (
                <div
                    className="folder"
                    data-foldername={folder}
                    onClick={this.props.onFolderClick}
                    onDoubleClick={this.props.onFolderDoubleClick}
                >
                    <div className={folderNameClass}>
                        {folder}
                    </div>
                </div>
            );
        });

        let _files = files.map((item, i) => {
            if(!item[0]) {
                return null;
            }
            let imgSrc = item[2] instanceof Blob ? URL.createObjectURL(item[2]) : 'img/ph_s.png';
            let selected = Monitor.selectedItem.name === item[0],
                fileNameClass = ClassNames('name', {'selected': selected}),
                iNameClass = ClassNames('fa', 'fa-times-circle-o', {'selected': selected});

            return (
                <div
                    title={item[0]}
                    className="file"
                    data-test-key={item[0]}
                    data-filename={item[0]}
                    onClick={this.props.onFileClick}
                    onDoubleClick={this.props.onFileDoubleClick}>
                    <div className="image-wrapper">
                        <img src={imgSrc} onError={this._imageError}/>
                        <i className={iNameClass}
                            onClick={this.props.onFileCrossIconClick}></i>
                    </div>
                    <div className={fileNameClass}>
                        {item[0].length > maxFileNameLength ? item[0].substring(0, maxFileNameLength) + '...' : item[0]}
                    </div>
                </div>
            );
        });

        return (
            <div className="wrapper">
                {_folders}
                {_files}
            </div>
        );
    }

    _retrieveFileInfo = () => {

    }

    _streamCamera = () => {
        if(!this.cameraStream) {
            let { selectedDevice } = this.props;
            DeviceMaster.streamCamera(selectedDevice).then(
                stream => {
                    this.cameraStream = stream;
                    this.cameraStream.subscribe(this._processImage);
                }
            );
        }

        let cameraClass = ClassNames(
            'camera-image',
            {'hd': this.state.isHd},
            {'beambox-camera': (['mozu1', 'fbm1', 'fbb1b', 'fbb1p', 'fbb2b', 'laser-b1', 'darwin-dev'].includes(this.props.selectedDevice.model))}
        );
        return(
            <img className={cameraClass} />
        );
    }

    _renderOriginMark = () => {
        const { Monitor } = this.props.context.store.getState();
        const { cameraOffset, currentPosition } = Monitor;
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

    _renderRelocateOrigin = () => {
        const { Monitor } = this.props.context.store.getState();
        const { cameraOffset, currentPosition } = Monitor;
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

    _handleMoveStart = () => {
        const { store } = this.props.context;
        store.dispatch(MonitorActionCreator.setMaintainMoving());
    }

    _handleMoveEnd = (x, y) => {
        x = Math.round(x * 10) / 10;
        y = Math.round(y * 10) / 10;
        const { store } = this.props.context;
        const currentPosition = {x, y};
        store.dispatch(MonitorActionCreator.setCurrentPosition(currentPosition));
    }

    _streamCameraRelocate = () => {
        if(!this.cameraStream) {
            DeviceMaster.streamCamera(false).then(
                stream => {
                    this.cameraStream = stream;
                    this.cameraStream.subscribe(this._processImage);
                }
            );
        }

        let cameraClass = ClassNames(
            'camera-image',
            {'hd': this.state.isHd},
            {'beambox-camera': (['mozu1', 'fbm1', 'fbb1b', 'fbb1p', 'fbb2b', 'laser-b1', 'darwin-dev'].includes(this.props.selectedDevice.model))}
        );
        return(
            <div className="camera-relocate-container">
                <div className="img-container">
                    <img className={cameraClass} ref='cameraStreamImg'/>
                </div>
                {this._renderOriginMark()}
                {this._renderRelocateOrigin()}
                <RawMovePanel
                    onMoveStart={this._handleMoveStart}
                    onMoveEnd={this._handleMoveEnd}
                />
            </div>
        );
    }

    _processImage = ({ imgBlob, }: { imgBlob: Blob })  => {
        let targetDevice = this.props.selectedDevice;
        if (targetDevice) {
            if (!hdChecked[targetDevice.serial]) {
                getImageSize(URL.createObjectURL(imgBlob), (size) => {
                    console.log('image size', size);
                    if (size[0] > 720) {
                        hdChecked[targetDevice.serial] = 2;
                    } else if (size[0] > 0) {
                        hdChecked[targetDevice.serial] = 1;
                    }
                });
            }

            this.setState({ isHd: hdChecked[targetDevice.serial] !== 1 });
        }
        previewBlob = imgBlob;
        $('.camera-image').attr('src', URL.createObjectURL(imgBlob));
    }

    _getJobType = () => {
        let { Monitor, Device } = this.props.context.store.getState();
        let { lang } = this.props.context, jobInfo, headProp, taskProp;

        jobInfo = Monitor.mode === GlobalConstants.FILE_PREVIEW ? Monitor.selectedFileInfo : Device.jobInfo;

        headProp = findObjectContainsProperty(jobInfo, 'HEAD_TYPE');
        taskProp = findObjectContainsProperty(jobInfo, 'TASK_TYPE');

        if(headProp.length === 0) {
            // From Bottom Right Start Button
            let operatingFunction = location.hash.split('/')[1];
            return lang.monitor.task[operatingFunction.toUpperCase()];
        } else if (taskProp.length > 0) {
            // Selected Task in File Browser
            return lang.monitor.task[taskProp[0].TASK_TYPE.toUpperCase()];
        }
        return lang.monitor.task[headProp[0].HEAD_TYPE.toUpperCase()];
    }

    _getJobTime = () => {
        let { Monitor, Device } = this.props.context.store.getState();
        let jobInfo, o;

        jobInfo = Monitor.mode === GlobalConstants.FILE_PREVIEW ? Monitor.selectedFileInfo : Device.jobInfo;
        o = findObjectContainsProperty(jobInfo, 'TIME_COST');
        return o.length > 0 ? o[0].TIME_COST : '';
    }

    _getJobProgress = () => {
        let { Monitor, Device } = this.props.context.store.getState();
        if(Monitor.mode === GlobalConstants.FILE_PREVIEW  || this._isAbortedOrCompleted()) {
            return '';
        }
        return Device.status.prog ? `${(Device.status.prog * 100).toFixed(1)}%` : '';
    }

    _isAbortedOrCompleted = () => {
        let { Device } = this.props.context.store.getState();
        return (
            Device.status.st_id === DeviceConstants.status.ABORTED ||
            Device.status.st_id === DeviceConstants.status.COMPLETED
        );
    }

    _renderDisplay = (mode) => {
        if(mode !== GlobalConstants.CAMERA && mode !==GlobalConstants.CAMERA_RELOCATE) {
            this.cameraStream = null;
        }
        let doMode = {};

        doMode[GlobalConstants.PREVIEW] = this._showPreview;
        doMode[GlobalConstants.PRINT] = this._showPreview;
        doMode[GlobalConstants.FILE] = this._listFolderContent;
        doMode[GlobalConstants.CAMERA] = this._streamCamera;
        doMode[GlobalConstants.CAMERA_RELOCATE] = this._streamCameraRelocate;
        doMode[GlobalConstants.FILE_PREVIEW] = this._showPreview;

        if(typeof doMode[mode] !== 'function') {
            return (<div></div>);
        }

        return doMode[mode]();
    }

    _renderRelocateButton = (Monitor) => {
        const { selectedDevice } = this.props;
        const { mode, relocateOrigin } = Monitor;
        const vc = VersionChecker(selectedDevice.version);
        if ([GlobalConstants.PREVIEW, GlobalConstants.FILE_PREVIEW].includes(mode) && !this._isAbortedOrCompleted() && vc.meetRequirement('RELOCATE_ORIGIN')) {
            return (
                <div className="btn-relocate-container">
                    <div className="btn-relocate" onClick={()=>this.props.onToggleRelocate()}>
                        <img src="img/beambox/icon-target.svg"/>
                        {(relocateOrigin.x !== 0 || relocateOrigin.y !== 0) ? 
                            <div className="relocate-origin">{`(${relocateOrigin.x}, ${relocateOrigin.y})`}</div>
                            : null
                        }
                    </div>
                </div>
            );
        } else {
            return null;
        }
    }

    _renderJobInfo = () => {
        let { Monitor, Device } = this.props.context.store.getState();
        const { selectedDevice } = this.props;
        if([GlobalConstants.FILE, GlobalConstants.CAMERA, GlobalConstants.CAMERA_RELOCATE].includes(Monitor.mode)) {
            return '';
        }

        let { slicingResult } = this.props.context,
            jobTime = FormatDuration(this._getJobTime()) || '',
            jobProgress = this._getJobProgress(),
            jobType = this._getJobType(),
            infoClass;
        infoClass = ClassNames(
            'status-info',
            {
                'running':
                    Monitor.mode === GlobalConstants.PRINT ||
                    ((Monitor.mode === GlobalConstants.PREVIEW || jobTime !== '') && jobType !== '')
            },
            {
                'hide':
                    (Monitor.mode === GlobalConstants.CAMERA || this._isAbortedOrCompleted())
                    && Monitor.selectedItem.name === ''
            }
        );

        // if job is not active, render from slicing result
        if(jobTime === '' && slicingResult) {
            let time = slicingResult.time || slicingResult.metadata.TIME_COST;
            jobTime = FormatDuration(time);
        }
        const relocateButton = this._renderRelocateButton(Monitor);

        return (
            <div className={infoClass}>
                <div className="verticle-align">
                    <div>{jobType}</div>
                    <div className="status-info-duration">{jobTime}</div>
                </div>
                {relocateButton}
                <div className="status-info-progress">{jobProgress}</div>
            </div>
        );
    }

    _handleSnapshot = async () => {
        if(previewBlob == null) return;
        let targetDevice = DeviceMaster.currentDevice.info,
            fileName = (targetDevice ? targetDevice.name + ' ' : '') + new Date().
                toLocaleString('en-GB', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'}).
                replace(/(\d+)\/(\d+)\/(\d+)\, (\d+):(\d+):(\d+)/, '$3-$1-$2 $4-$5-$6')+ ".jpg";
        
        const targetFilePath = await ElectronDialogs.saveFileDialog(fileName , fileName, [{extensionName: 'jpg', extensions: ['jpg']}]);
        if (targetFilePath) {
            const fs = requireNode('fs');
            const arrBuf = await new Response(previewBlob).arrayBuffer();
            const buf = Buffer.from(arrBuf);
            fs.writeFileSync(targetFilePath, buf);
        }
    }

    _renderSpinner = () => {
        return (
            <div className="spinner-wrapper">
                <div className="spinner-flip"/>
            </div>
        );
    }

    render() {
        let { Monitor } = this.props.context.store.getState();
        let content = this._renderDisplay(Monitor.mode),
            jobInfo = this._renderJobInfo(),
            specialBtn = Monitor.mode == GlobalConstants.CAMERA ? (<div className="btn-snap" onClick={this._handleSnapshot}>
                <i className="fa fa-camera"></i>
            </div>) : "";

        if(Monitor.isWaiting) {
            content = this._renderSpinner();
            jobInfo = '';
        }

        return (
            <div className="body">
                <div className="device-content">
                    {specialBtn}
                    {content}
                    {jobInfo}
                </div>
            </div>
        );
    }
};

export default MonitorDisplay;
