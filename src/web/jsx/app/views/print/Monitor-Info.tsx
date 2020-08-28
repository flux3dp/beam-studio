function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['reactPropTypes', 'app/constants/global-constants', 'app/constants/device-constants', 'app/constants/monitor-status', 'helpers/duration-formatter'], (PropTypes, GlobalConstants, DeviceConstants, MonitorStatus, FormatDuration) => {
  'use strict';

  const React = require('react');

  const findObjectContainsProperty = (infoArray = [], propertyName) => {
    return infoArray.filter(o => Object.keys(o).some(n => n === propertyName));
  };

  class MonitorInfo extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_isAbortedOrCompleted", () => {
        let {
          Device
        } = this.props.context.store.getState();
        return Device.status.st_id === DeviceConstants.status.ABORTED || Device.status.st_id === DeviceConstants.status.COMPLETED;
      });

      _defineProperty(this, "_getHeadInfo", () => {
        let {
          Device
        } = this.props.context.store.getState();
        return Device.status.module ? this.lang.monitor.device[Device.status.module] : '';
      });

      _defineProperty(this, "_getStatus", () => {
        let {
          Monitor,
          Device
        } = this.props.context.store.getState();

        if (Boolean(Monitor.uploadProgress)) {
          return this.lang.device.uploading;
        }

        if (Device.status.st_label && Device.status.st_label !== 'LOAD_FILAMENT' && Device.status.st_label !== 'UNLOAD_FILAMENT') {
          let {
            displayStatus
          } = MonitorStatus[Device.status.st_label]();
          return displayStatus;
        } else {
          return '';
        }
      });

      _defineProperty(this, "_getTemperature", () => {
        let {
          Device
        } = this.props.context.store.getState();

        if (!Device.status || this._isAbortedOrCompleted()) {
          return '';
        } // rt = real temperature, tt = target temperature


        let {
          st_label,
          rt,
          tt
        } = Device.status,
            lang = this.lang.monitor;

        if (st_label === DeviceConstants.RUNNING) {
          return rt ? `${lang.temperature} ${parseInt(rt * 10) / 10} °C` : '';
        } else {
          return rt ? `${lang.temperature} ${parseInt(rt * 10) / 10} °C / ${tt} °C` : '';
        }
      });

      _defineProperty(this, "_getProgress", () => {
        this.props.context.slicingResult = this.props.context.slicingResult || null;
        let {
          Monitor,
          Device
        } = this.props.context.store.getState(),
            time = this.props.context.slicingResult ? this.props.context.slicingResult.time : undefined,
            lang = this.lang.monitor;

        if (Object.keys(Device.status).length === 0) {
          return lang.connecting;
        }

        if (Number.isInteger(Monitor.uploadProgress)) {
          return `${lang.processing} ${Monitor.uploadProgress}%`;
        }

        if (Monitor.downloadProgress.size !== '') {
          return `${lang.processing} ${parseInt((Monitor.downloadProgress.size - Monitor.downloadProgress.left) / Monitor.downloadProgress.size * 100)}%`;
        }

        let o = findObjectContainsProperty(Device.jobInfo, 'TIME_COST');

        if (o.length !== 0) {
          time = o[0].TIME_COST;
        }

        if (!Device.status || !Device.jobInfo || typeof time === 'undefined' || Monitor.mode === GlobalConstants.FILE_PREVIEW || this._isAbortedOrCompleted() || Device.status.st_label === 'WAITING_HEAD' || !Device.status.prog) {
          return '';
        }

        let percentageDone = parseInt(Device.status.prog * 100),
            // timeLeft = FormatDuration(o[0].TIME_COST * (1 - Device.status.prog));
        timeLeft = FormatDuration(time * (1 - Device.status.prog));
        return `${percentageDone}%, ${timeLeft} ${this.lang.monitor.left}`;
      });

      const {
        store,
        lang: _lang
      } = this.props.context;
      MonitorStatus['setLang'](_lang);
      this.lang = _lang;
      this.unsubscribe = store.subscribe(() => {
        this.forceUpdate();
      });
    }

    componentWillUnmount() {
      clearInterval(this.timer);
      this.unsubscribe();
    }

    render() {
      return /*#__PURE__*/React.createElement("div", {
        className: "wrapper"
      }, /*#__PURE__*/React.createElement("div", {
        className: "row"
      }, /*#__PURE__*/React.createElement("div", {
        className: "head-info"
      }, this._getHeadInfo()), /*#__PURE__*/React.createElement("div", {
        className: "status right"
      }, this._getStatus())), /*#__PURE__*/React.createElement("div", {
        className: "row"
      }, /*#__PURE__*/React.createElement("div", {
        className: "temperature"
      }, this._getTemperature()), /*#__PURE__*/React.createElement("div", {
        className: "time-left right"
      }, this._getProgress())));
    }

  }

  ;
  return MonitorInfo;
});