define([
    'reactPropTypes',
    'app/constants/global-constants',
    'app/constants/device-constants',
    'helpers/device-master',
    'plugins/classnames/index',
    'helpers/duration-formatter'
], (
    PropTypes,
    GlobalConstants,
    DeviceConstants,
    DeviceMaster,
    ClassNames,
    FormatDuration
) => {
    const React = require('react');

    'use strict';

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
                    item = [result.files[i]];
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
                {'beambox-camera': (['mozu1', 'fbm1', 'fbb1b', 'fbb1p', 'laser-b1', 'darwin-dev'].includes(this.props.selectedDevice.model))}
            );
            return(
                <img className={cameraClass} />
            );
        }

        _processImage = (imageBlob)  => {
            let targetDevice = this.props.selectedDevice;
            if (targetDevice) {
                if (!hdChecked[targetDevice.serial]) {
                    getImageSize(URL.createObjectURL(imageBlob), (size) => {
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
            previewBlob = imageBlob;
            $('.camera-image').attr('src', URL.createObjectURL(imageBlob));
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
            return Device.status.prog ? `${parseInt(Device.status.prog * 100)}%` : '';
        }

        _isAbortedOrCompleted = () => {
            let { Device } = this.props.context.store.getState();
            return (
                Device.status.st_id === DeviceConstants.status.ABORTED ||
                Device.status.st_id === DeviceConstants.status.COMPLETED
            );
        }

        _renderDisplay = (mode) => {
            if(mode !== GlobalConstants.CAMERA) {
                this.cameraStream = null;
            }
            let doMode = {};

            doMode[GlobalConstants.PREVIEW] = this._showPreview;
            doMode[GlobalConstants.PRINT] = this._showPreview;
            doMode[GlobalConstants.FILE] = this._listFolderContent;
            doMode[GlobalConstants.CAMERA] = this._streamCamera;
            doMode[GlobalConstants.FILE_PREVIEW] = this._showPreview;

            if(typeof doMode[mode] !== 'function') {
                return (<div></div>);
            }

            return doMode[mode]();
        }

        _renderJobInfo = () => {
            let { Monitor, Device } = this.props.context.store.getState();
            if(Monitor.mode === GlobalConstants.FILE || Monitor.mode === GlobalConstants.CAMERA) {
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

            return (
                <div className={infoClass}>
                    <div className="verticle-align">
                        <div>{jobType}</div>
                        <div className="status-info-duration">{jobTime}</div>
                    </div>
                    <div className="status-info-progress">{jobProgress}</div>
                </div>
            );
        }

        _handleSnapshot = () => {
            if(previewBlob == null) return;
            let targetDevice = DeviceMaster.getSelectedDevice(),
                fileName = (targetDevice ? targetDevice.name + ' ' : '') + new Date().
                    toLocaleString('en-GB', {year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'}).
                    replace(/(\d+)\/(\d+)\/(\d+)\, (\d+):(\d+):(\d+)/, '$3-$1-$2 $4-$5-$6')+ ".jpg";

            saveAs(previewBlob, fileName);
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
    return MonitorDisplay;

});
