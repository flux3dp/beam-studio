import GlobalConstants from '../../constants/global-constants';
import DeviceConstants from '../../constants/device-constants';
const ClassNames = requireNode('classnames');
const React = requireNode('react');

const findObjectContainsProperty = (infoArray = [], propertyName) => {
    return infoArray.filter((o) => Object.keys(o).some(n => n === propertyName));
};

const type = { FILE: 'FILE', FOLDER: 'FOLDER' };

class MonitorControl extends React.Component{
    constructor(props) {
        super(props);
        let { store } = this.props.context;

        this.unsubscribe = store.subscribe(() => {
            this.forceUpdate();
        });
    }

    UNSAFE_componentWillUpdate() {
        return false;
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    _operation = () => {
        let { Monitor, Device } = this.props.context.store.getState();
        let { lang } = this.props.context;

        let cameraClass = ClassNames('btn-camera btn-control', { 'on': Monitor.mode === GlobalConstants.CAMERA }),
            cameraDescriptionClass = ClassNames('description', { 'on': Monitor.mode === GlobalConstants.CAMERA }),
            className;

        return {

            go: (enable) => {
                className = ClassNames('controls center', {'disabled': !enable});
                return (
                    <div className={className} onClick={this.props.onGo}>
                        <div className="btn-go btn-control"></div>
                        <div className="description">{lang.monitor.go}</div>
                    </div>
                );
            },

            pause: (enable) => {
                className = ClassNames('controls center', {'disabled': !enable});
                return (
                    <div className={className} onClick={this.props.onPause}>
                        <div className="btn-pause btn-control"></div>
                        <div className="description">{lang.monitor.pause}</div>
                    </div>
                );
            },

            stop: (enable) => {
                className = ClassNames('controls left', {'disabled': !enable});
                return (
                    <div className={className} onClick={this.props.onStop}>
                        <div className="btn-stop btn-control"></div>
                        <div className="description">{lang.monitor.stop}</div>
                    </div>
                );
            },

            upload: (enable) => {
                className = ClassNames('controls left', {'disabled': !enable});
                return (
                    <div className={className} onClick={this.props.onUpload}>
                        <div className="btn-upload btn-control"></div>
                        <input className="upload-control" type="file" accept=".fc, .gcode" onChange={this.props.onUpload} />
                        <div className="description">{lang.monitor.upload}</div>
                    </div>
                );
            },

            download: (enable) => {
                className = ClassNames('controls center', {'disabled': !enable});
                return (
                    <div className={className} onClick={this.props.onDownload}>
                        <div className="btn-download btn-control"></div>
                        <div className="description">{lang.monitor.download}</div>
                    </div>
                );
            },

            camera: (enable) => {
                className = ClassNames('controls right', {'disabled': !enable});
                return (
                    <div className={className} onClick={this.props.onToggleCamera}>
                        <div className={cameraClass}></div>
                        <div className={cameraDescriptionClass}>{lang.monitor.camera}</div>
                    </div>
                );
            },

            preparing: (enable) => {
                className = ClassNames('controls center', {'disabled': true});
                return (
                <div className={className}>
                    <div className="btn-pause btn-control"></div>
                    <div className="description">{lang.monitor.pause}</div>
                </div>
                );
            }
        };
    }

    _renderRelocateButton = () => {
        const { lang } = this.props.context;
        const { Monitor } = this.props.context.store.getState();
        const { isMaintainMoving } = Monitor;
        const className = ClassNames('controls right', {'disabled': isMaintainMoving});
        return (
            <div className={className} onClick={this.props.onRelocate}>
                <div className="btn-control btn-relocate">
                    <img src="img/beambox/icon-target.svg"/>
                </div>
                <div className="description">{lang.monitor.relocate}</div>
            </div>
        );
    }

    _renderCancelButton = () => {
        const { lang } = this.props.context;
        const className = ClassNames('controls left');
        return (
            <div className={className} onClick={this.props.onCancelRelocate}>
                <div className="btn-control btn-cancel" />
                <div className="description">{lang.monitor.cancel}</div>
            </div>
        );
    }

    _isAbortedOrCompleted = (statusId?) => {
        let { Device } = this.props.context.store.getState();
        statusId = statusId || Device.status.st_id;
        return (
            statusId === DeviceConstants.status.ABORTED ||
            statusId === DeviceConstants.status.COMPLETED
        );
    }

    _getJobType = () => {
        let { lang } = this.props.context, jobInfo, o;
        let { Monitor, Device } = this.props.context.store.getState();

        jobInfo = Monitor.mode === GlobalConstants.FILE_PREVIEW ? Monitor.selectedFileInfo : Device.jobInfo;
        o = findObjectContainsProperty(jobInfo, 'HEAD_TYPE');

        // this should be updated when slicer returns the same info as play info
        if(jobInfo.length === 0 && this.props.previewUrl) {
            return lang.monitor.task['EXTRUDER'];
        }

        return o.length > 0 ? lang.monitor.task[o[0].HEAD_TYPE.toUpperCase()] : '';
    }

    _renderButtons = () => {
        let { Monitor, Device } = this.props.context.store.getState()
        let { selectedItem } = Monitor;
        let commands, action, statusId, currentStatus;
        let leftButtonOn = false,
            middleButtonOn = false,
            rightButtonOn = true;

        statusId = Device.status.st_id;
        currentStatus = Device.status.st_label;
        commands = {
            'IDLE'          : () => { return this._operation().go; },
            'RUNNING'       : () => { return this._operation().pause; },
            'STARTING'      : () => { return this._operation().preparing; },
            'INIT'          : () => { return this._operation().preparing; },
            'WAITING_HEAD'  : () => { return this._operation().preparing; },
            'CORRECTING'    : () => { return this._operation().preparing; },
            'PAUSING'       : () => { return this._operation().go; },
            'PAUSED'        : () => { return this._operation().go; },
            'ABORTED'       : () => { return this._operation().go; },
            'HEATING'       : () => { return this._operation().preparing; },
            'CALIBRATING'   : () => { return this._operation().preparing; },
            'RESUMING'      : () => { return this._operation().pause; },
            'COMPLETED'     : () => { return this._operation().go; }
        };

        action = !!commands[currentStatus] ? commands[currentStatus]() : '';

        if(Monitor.mode === GlobalConstants.CAMERA) {
            // CAMERA mode
            if(statusId === DeviceConstants.status.MAINTAIN || this._getJobType() === '') {
                middleButtonOn = false;
            }
            else {
                middleButtonOn = true;
            }

            if(
                statusId === DeviceConstants.status.IDLE ||
                statusId === DeviceConstants.status.COMPLETED ||
                statusId === DeviceConstants.status.ABORTED
            ) {
                leftButtonOn = false;

                if(this.props.source === 'DEVICE_LIST') {
                    middleButtonOn = false;
                }
            }
            else {
                leftButtonOn = true;
            }
        } else if(Monitor.mode === GlobalConstants.FILE) {
            // FILE mode
            leftButtonOn = Monitor.currentPath !== '';
            middleButtonOn = selectedItem.type === type.FILE;
        } else if(Monitor.mode === GlobalConstants.PRINT) {
            // PRINT mode
            leftButtonOn = true;

            if(
                currentStatus === DeviceConstants.IDLE ||
                currentStatus === DeviceConstants.STARTING ||
                currentStatus === DeviceConstants.RESUMING ||
                statusId === DeviceConstants.status.PAUSING_FROM_RUNNING ||
                statusId === DeviceConstants.status.MAINTAIN ||
                statusId === DeviceConstants.status.SCAN ||
                this._getJobType() === '' ||
                this._isAbortedOrCompleted()
            ) {
                middleButtonOn = false;
                leftButtonOn = false;
            }
            else {
                middleButtonOn = true;
            }

            if(this.props.source === GlobalConstants.DEVICE_LIST && statusId === DeviceConstants.status.IDLE) {
                leftButtonOn = false;
                middleButtonOn = false;
            }

            if(statusId === DeviceConstants.status.INIT) {
                leftButtonOn = false;
            }
        } else if (Monitor.mode === GlobalConstants.PREVIEW) {
            // PREVIEW mode
            middleButtonOn = true;
            if(
                statusId === DeviceConstants.status.IDLE ||
                statusId === DeviceConstants.status.COMPLETED ||
                statusId === DeviceConstants.status.ABORTED
            ) {
                leftButtonOn = false;
            }

            if(statusId === DeviceConstants.status.MAINTAIN ||
                statusId === DeviceConstants.status.SCAN ||
                this._isAbortedOrCompleted(statusId)
            ) {
                middleButtonOn = false;
            }
            else {
                middleButtonOn = true;
            }
        } else if (Monitor.mode === GlobalConstants.FILE_PREVIEW) {
            // FILE PREVIEW mode
            leftButtonOn = true;
            middleButtonOn = true;

            if( currentStatus === DeviceConstants.IDLE ) {
                leftButtonOn = false;
            }
        }

        if (!['IDLE', 'PAUSED', 'ABORTED', 'COMPLETED'].includes(currentStatus)) {
            rightButtonOn = false;
        }

        if(Object.keys(Device.status).length === 0) {
            leftButtonOn = false;
            middleButtonOn = false;
        }

        let leftButton = Monitor.mode === GlobalConstants.FILE ? this._operation().upload : this._operation().stop,
            middleButton = Monitor.mode === GlobalConstants.FILE ? this._operation().download : action,
            rightButton = this._operation().camera;
        if (Monitor.mode !== GlobalConstants.CAMERA_RELOCATE) {
            leftButton = leftButton(leftButtonOn);

            if(middleButton !== '') {
                middleButton = middleButton(middleButtonOn);
            }

            rightButton = rightButton(rightButtonOn);
        } else {
            leftButton = this._renderCancelButton();
            middleButton = null;
            rightButton = this._renderRelocateButton();
        }

        return {
            leftButton,
            middleButton,
            rightButton
        };
    }

    render() {
        let { leftButton, middleButton, rightButton } = this._renderButtons();

        return (
            <div className="operation">
                {leftButton}
                {middleButton}
                {rightButton}
            </div>
        );
    }
};

export default MonitorControl;
