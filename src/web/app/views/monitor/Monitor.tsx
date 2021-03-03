const React = requireNode('react');
const classNames = requireNode('classnames');

import { Mode } from 'app/constants/monitor-constants';
import { MonitorContext } from 'app/contexts/Monitor-Context';
import Modal from 'app/widgets/Modal';
import FormatDuration from 'helpers/duration-formatter';
import MonitorStatus from 'helpers/monitor-status';
import i18n from 'helpers/i18n';
import isObjectEmpty from 'helpers/is-object-empty';

import MonitorHeader, { NavBtnType } from './Monitor-Header';
import MonitorFilelist from './Monitor-Filelist';
import MonitorTask from './Monitor-Task';
import MonitorControl from './Monitor-Control';
import MonitorCamera from './Monitor-Camera';
import MonitorRelocate from './Monitor-Relocate';
import MonitorInfo from './Monitor-Info';

let LANG = i18n.lang;

const updateLang = () => {
    LANG = i18n.lang;
}

export default class Monitor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentPath: [],
            mode: props.mode,
            selectedItem: {},
            fileInfo: null,
            report: {},
        };
        updateLang();
    }

    renderHeader() {
        const { device } = this.props;
        const { currentPath, mode, previewTask } = this.context;

        let navBtnType = NavBtnType.BACK;
        if (mode === Mode.PREVIEW) {
            navBtnType = NavBtnType.FOLDER;
        } else if (mode === Mode.FILE && currentPath.length === 0 && !previewTask) {
            navBtnType = NavBtnType.NONE;
        } else if (mode === Mode.WORKING) {
            navBtnType = NavBtnType.NONE;
        }

        return (
            <MonitorHeader
                name={device.name}
                navBtnType={navBtnType}
            />
        );
    }

    renderFileList() {
        const { currentPath } = this.context;
        const path = currentPath.join('/');
        return (
            <MonitorFilelist
                path={path}
            />
        );
    }

    renderTask() {
        const { device } = this.props;
        return (
            <MonitorTask
                device={device}
            />
        );
    }

    renderControl() {
        return (<MonitorControl/>);
    }

    renderCamera() {
        const { device } = this.props;
        return (
            <MonitorCamera
                device={device}
            />
        );
    }

    renderRelocate() {
        const { device } = this.props;
        return (
            <MonitorRelocate
                device={device}
            />
        );
    }

    renderInfo() {
        const { report, uploadProgress } = this.context;
        const getStatusText = () => {
            if (uploadProgress !== null) {
                return LANG.device.uploading;
            }

            if (isObjectEmpty(report)) {
                return LANG.monitor.connecting;
            }

            if(report.st_label) {
                const displayStatus = MonitorStatus.getDisplayStatus(report.st_label);
                return displayStatus;
            }
            return '';
        }

        const getInfoProgressText = () => {
            const { mode, taskTime, report, uploadProgress, downloadProgress } = this.context;
    
            if (uploadProgress !== null) {
                return `${LANG.monitor.processing} ${uploadProgress}%`;
            }
    
            if(downloadProgress !== null) {
                return `${LANG.monitor.processing} ${Math.floor((downloadProgress.size - downloadProgress.left) / downloadProgress.size * 100)}%`;
            }
    
            if (!taskTime || mode !== Mode.WORKING || !report.prog || MonitorStatus.isAbortedOrCompleted(report)) {
                return '';
            }
    
            const percentageDone = Math.floor(report.prog * 100);
            const timeLeft = FormatDuration(taskTime * (1 - report.prog));
    
            return `${percentageDone}%, ${timeLeft} ${i18n.lang.monitor.left}`;
        }

        return (
            <MonitorInfo
                status={getStatusText()}
                progress={getInfoProgressText()}
            />
        )
    }

    render() {
        const { mode } = this.context;
        let body: Element;
        if (mode === Mode.FILE) {
            body = this.renderFileList();
        } else if ([Mode.PREVIEW, Mode.FILE_PREVIEW, Mode.WORKING].includes(mode)) {
            body = this.renderTask();
        } else if (mode === Mode.CAMERA) {
            body = this.renderCamera();
        } else if (mode === Mode.CAMERA_RELOCATE) {
            body = this.renderRelocate();
        }

        return (
            <Modal>
                <div className="flux-monitor">
                    <div className="main">
                        {this.renderHeader()}
                        <div className="body">
                            <div className="device-content">
                                {body}
                            </div>
                        </div>
                        {this.renderControl()}
                    </div>
                    <div className={classNames('sub', { 'hide': false })}>
                        {this.renderInfo()}
                    </div>
                </div>
            </Modal>
        );
    }
};

Monitor.contextType = MonitorContext;
