import GlobalConstants from '../../../app/constants/global-constants';
import DeviceConstants from '../../../app/constants/device-constants';
import MonitorStatus from '../../../helpers/monitor-status';
import FormatDuration from '../../../helpers/duration-formatter';

const React = requireNode('react');

const findObjectContainsProperty = (infoArray = [], propertyName) => {
    return infoArray.filter((o) => Object.keys(o).some(n => n === propertyName));
};

class MonitorInfo extends React.Component{
    constructor(props) {
        super(props);
        const { store, lang } = this.props.context;
        MonitorStatus['setLang'](lang);

        this.lang = lang;
        this.unsubscribe = store.subscribe(() => {
            this.forceUpdate();
        });
    }

    componentWillUnmount() {
        clearInterval(this.timer);
        this.unsubscribe();
    }

    _isAbortedOrCompleted = () => {
        let { Device } = this.props.context.store.getState();
        return (
            Device.status.st_id === DeviceConstants.status.ABORTED ||
            Device.status.st_id === DeviceConstants.status.COMPLETED
        );
    }

    _getStatus = () => {
        let { Monitor, Device } = this.props.context.store.getState();

        if(Boolean(Monitor.uploadProgress)) {
            return this.lang.device.uploading;
        }
        if(
            Device.status.st_label &&
            Device.status.st_label !== 'LOAD_FILAMENT' &&
            Device.status.st_label !== 'UNLOAD_FILAMENT'
        ) {
            const displayStatus = MonitorStatus.getDisplayStatus(Device.status.st_label);
            return displayStatus;
        }
        else {
            return '';
        }
    }

    _getTemperature = () => {
        let { Device } = this.props.context.store.getState();
        if(!Device.status || this._isAbortedOrCompleted()) {
            return '';
        }

        // rt = real temperature, tt = target temperature
        let st_label = Device.status.st_label,
            rt: number = Device.status.rt,
            tt: number = Device.status.st,
            lang = this.lang.monitor;

        if(st_label === DeviceConstants.RUNNING) {
            return rt ? `${lang.temperature} ${rt.toFixed(1)} °C` : '';
        }
        else {
            return rt ? `${lang.temperature} ${rt.toFixed(1)} °C / ${tt} °C` : '';
        }
    }

    _getProgress = () => {
        this.props.context.slicingResult = this.props.context.slicingResult || null;
        let { Monitor, Device } = this.props.context.store.getState(),
            time = this.props.context.slicingResult ? this.props.context.slicingResult.time : undefined,
            lang = this.lang.monitor;

        if(Object.keys(Device.status).length === 0) {
            return lang.connecting;
        }

        if(Number.isInteger(Monitor.uploadProgress)) {
            return `${lang.processing} ${Monitor.uploadProgress}%`;
        }

        if(Monitor.downloadProgress.size !== '') {
            return `${lang.processing} ${Math.floor((Monitor.downloadProgress.size - Monitor.downloadProgress.left) / Monitor.downloadProgress.size * 100)}%`;
        }

        let o = findObjectContainsProperty(Device.jobInfo, 'TIME_COST');
        if(o.length !== 0) {
            time = o[0].TIME_COST;
        }

        if(
            !Device.status ||
            !Device.jobInfo ||
            typeof time === 'undefined' ||
            Monitor.mode === GlobalConstants.FILE_PREVIEW ||
            this._isAbortedOrCompleted() ||
            Device.status.st_label === 'WAITING_HEAD' ||
            !Device.status.prog
        ) {
            return '';
        }

        let percentageDone = Math.floor(Device.status.prog * 100),
        // timeLeft = FormatDuration(o[0].TIME_COST * (1 - Device.status.prog));
        timeLeft = FormatDuration(time * (1 - Device.status.prog));

        return `${percentageDone}%, ${timeLeft} ${this.lang.monitor.left}`;
    }

    render() {
        return (
            <div className="wrapper">
                <div className="row">
                    <div className="head-info">
                    </div>
                    <div className="status right">
                        {this._getStatus()}
                    </div>
                </div>
                <div className="row">
                    <div className="temperature">{this._getTemperature()}</div>
                    <div className="time-left right">{this._getProgress()}</div>
                </div>
            </div>
        );
    }
};

export default MonitorInfo;
