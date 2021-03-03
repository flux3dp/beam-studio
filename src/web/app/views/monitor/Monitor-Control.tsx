const React = requireNode('react');
const classNames = requireNode('classnames');

import { Mode, ItemType } from 'app/constants/monitor-constants';
import DeviceConstants from 'app/constants/device-constants';
import { MonitorContext } from 'app/contexts/Monitor-Context';
import MonitorStatus, { ButtonTypes } from 'helpers/monitor-status';
import i18n from 'helpers/i18n';
import deviceConstants from 'app/constants/device-constants';

let LANG = i18n.lang.monitor;
const updateLang = () => {
    LANG = i18n.lang.monitor;
};

enum ButtonPosition {
    LEFT = 'left',
    CENTER = 'center',
    RIGHT = 'right',
};

export default class MonitorControl extends React.PureComponent {
    constructor(props) {
        super(props);
        updateLang();
    }

    renderControlButton(position: ButtonPosition, enable: boolean, iconClass: string, description: string, callback=() => {},) {
        const containerClass = classNames('controls', position, {disabled: !enable});

        return (
            <div className={containerClass} onClick={() => callback()}>
                <div className={classNames('btn-control', iconClass)}/>
                <div className='description'>{description}</div>
            </div>
        )
    }

    renderUploadButton(enable: boolean) {
        const { onUpload } = this.context;
        const containerClass = classNames('controls left', {disabled: !enable});
        return (
            <div className={containerClass} onClick={onUpload}>
                <div className='btn-upload btn-control'></div>
                <input className='upload-control' type='file' accept='.fc' onChange={onUpload} />
                <div className='description'>{LANG.upload}</div>
            </div>
        );
    }

    renderCameraButton(enable: boolean = true) {
        const { mode, toggleCamera } = this.context;
        const className = classNames('controls right', {'disabled': !enable});
        const iconClass = classNames('btn-camera btn-control', { 'on': mode === Mode.CAMERA });
        const descriptionClass = classNames('description', { 'on': mode === Mode.CAMERA });
        return (
            <div className={className} onClick={toggleCamera}>
                <div className={iconClass}/>
                <div className={descriptionClass}>{LANG.camera}</div>
            </div>
        );
    }

    renderRelocateButton() {
        const { isMaintainMoving, onRelocate } = this.context;
        const className = classNames('controls right', {'disabled': isMaintainMoving});

        return (
            <div className={className} onClick={onRelocate}>
                <div className='btn-control btn-relocate'>
                    <img src='img/beambox/icon-target.svg'/>
                </div>
                <div className='description'>{LANG.relocate}</div>
            </div>
        );

    }

    mapButtonTypeToElement(buttonType: ButtonTypes, position: ButtonPosition) {
        const { onPlay, onPause, onStop } = this.context;
        if (buttonType === ButtonTypes.PLAY) {
            return this.renderControlButton(position, true, 'btn-go', LANG.go, onPlay);
        } else if (buttonType === ButtonTypes.DISABLED_PLAY) {
            return this.renderControlButton(position, false, 'btn-go', LANG.go, null);
        } else if (buttonType === ButtonTypes.PAUSE) {
            return this.renderControlButton(position, true, 'btn-pause', LANG.pause, onPause);
        } else if (buttonType === ButtonTypes.DISABLED_PAUSE) {
            return this.renderControlButton(position, false, 'btn-pause', LANG.pause, null);
        } else if (buttonType === ButtonTypes.STOP) {
            return this.renderControlButton(position, true, 'btn-stop', LANG.stop, onStop);
        } else if (buttonType === ButtonTypes.DISABLED_STOP) {
            return this.renderControlButton(position, false, 'btn-stop', LANG.stop, null);
        }
        return null;
    }

    render() {
        const { mode, currentPath, highlightedItem, report, onDownload, onPlay, onStop, endRelocate } = this.context;
        let leftButton: Element, midButton: Element, rightButton: Element;
        if (mode === Mode.FILE ) {
            const allowUpload = currentPath.length > 0;
            const allowDownload = highlightedItem && highlightedItem.type === ItemType.FILE;
            // TODO file upload/download
            leftButton = this.renderUploadButton(allowUpload);
            midButton = this.renderControlButton(ButtonPosition.CENTER, allowDownload, 'btn-download', LANG.download, onDownload);
        } else if (mode === Mode.PREVIEW || mode === Mode.FILE_PREVIEW) {
            const allowPlay = (!!report && report.st_id === DeviceConstants.status.IDLE); 
            leftButton = this.renderControlButton(ButtonPosition.LEFT, false, 'btn-stop', LANG.stop, onStop);
            midButton = this.renderControlButton(ButtonPosition.CENTER, allowPlay, 'btn-go', LANG.go, onPlay);
        } else if (mode === Mode.WORKING) {
            const buttonTypes = MonitorStatus.getControlButtonType(report);
            leftButton = this.mapButtonTypeToElement(buttonTypes.left, ButtonPosition.LEFT);
            midButton = this.mapButtonTypeToElement(buttonTypes.mid, ButtonPosition.CENTER);
        } else if (mode === Mode.CAMERA) {
            leftButton = this.renderControlButton(ButtonPosition.LEFT, false, 'btn-stop', LANG.stop);
            midButton = this.renderControlButton(ButtonPosition.CENTER, false, 'btn-go', LANG.go);
        } else if (mode === Mode.CAMERA_RELOCATE) {
            leftButton = this.renderControlButton(ButtonPosition.LEFT, true, 'btn-cancel', LANG.cancel, endRelocate);
            rightButton = this.renderRelocateButton();
        } 

        if (mode !== Mode.CAMERA_RELOCATE) {
            const deviceStatusId = deviceConstants.status;
            const isCameraEnabled = [
                deviceStatusId.IDLE,
                deviceStatusId.PAUSED,
                deviceStatusId.PAUSED_FROM_STARTING,
                deviceStatusId.PAUSED_FROM_RUNNING,
                deviceStatusId.COMPLETED,
                deviceStatusId.ABORTED,
            ].includes(report.st_id);
            rightButton = this.renderCameraButton(isCameraEnabled);
        }

        return (
            <div className='operation'>
                {leftButton}
                {midButton}
                {rightButton}
            </div>
        );
    }
};

MonitorControl.contextType = MonitorContext;
