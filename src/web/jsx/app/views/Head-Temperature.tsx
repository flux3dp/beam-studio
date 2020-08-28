function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['helpers/i18n', 'jsx!widgets/Modal', 'jsx!widgets/AlertDialog', 'helpers/device-master', 'app/constants/device-constants', 'app/actions/alert-actions'], function (i18n, Modal, AlertDialog, DeviceMaster, DeviceConstants, AlertActions) {
  'use strict';

  var _temp;

  const React = require('react');

  const ReactDOM = require('react-dom');

  var lang = i18n.get();
  return _temp = class HeadTemperature extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_startReport", () => {
        this.report = setInterval(() => {
          const getStatus = () => {
            return this.operateDuringPause ? DeviceMaster.getReport() : DeviceMaster.getHeadStatus();
          };

          getStatus().then(status => {
            if (status.rt) {
              this.setState({
                currentTemperature: Math.round(status.rt[0])
              });
            }
          });
        }, 1500);
      });

      _defineProperty(this, "_handleChangeTemperature", e => {
        this.setState({
          enteredTemperature: e.target.value
        });
      });

      _defineProperty(this, "_handleSetTemperature", e => {
        e.preventDefault();
        let t = parseInt(this.state.enteredTemperature);

        if (t > 230) {
          t = 230;
        } else if (t < 60) {
          t = 60;
        }

        this.setState({
          targetTemperature: t
        });
        ReactDOM.findDOMNode(this.refs.temperature).value = t;

        if (this.operateDuringPause) {
          DeviceMaster.setHeadTemperatureDuringPause(t);
        } else {
          DeviceMaster.setHeadTemperature(t);
        }
      });

      this.state = {
        currentTemperature: 0,
        enteredTemperature: '',
        targetTemperature: ''
      };
    }

    componentDidMount() {
      const checkToolhead = () => {
        DeviceMaster.headInfo().then(info => {
          if (info.TYPE === DeviceConstants.EXTRUDER) {
            this._startReport();
          } else {
            let message = lang.head_temperature.incorrect_toolhead;

            if (info.head_module === null) {
              message = lang.head_temperature.attach_toolhead;
            }

            AlertActions.showPopupError('HEAD-ERROR', message);
            this.props.onClose();
          }
        });
      };

      DeviceMaster.getReport().then(report => {
        this.operateDuringPause = report.st_id === 48;

        if (this.operateDuringPause) {
          DeviceMaster.startToolheadOperation().then(() => {
            this._startReport();
          });
        } else {
          DeviceMaster.enterMaintainMode().then(() => {
            checkToolhead();
          });
        }
      });
    }

    componentWillUnmount() {
      if (this.operateDuringPause) {
        DeviceMaster.endToolheadOperation();
      } else {
        DeviceMaster.quitTask();
      }

      clearInterval(this.report);
    }

    render() {
      let {
        currentTemperature,
        targetTemperature
      } = this.state,
          temperature,
          buttons,
          content,
          className;
      buttons = [{
        label: lang.head_temperature.done,
        className: 'btn-default btn-alone-right',
        onClick: this.props.onClose
      }];
      temperature = currentTemperature + (targetTemperature ? ` / ${targetTemperature}` : '');
      temperature += ' °C';
      content = /*#__PURE__*/React.createElement("div", {
        className: "info"
      }, /*#__PURE__*/React.createElement("div", {
        className: "section"
      }, /*#__PURE__*/React.createElement("div", {
        className: "title"
      }, /*#__PURE__*/React.createElement("label", null, lang.head_temperature.target_temperature)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
        type: "number",
        ref: "temperature",
        onChange: this._handleChangeTemperature
      }), /*#__PURE__*/React.createElement("button", {
        className: "btn-default",
        onClick: this._handleSetTemperature
      }, lang.head_temperature.set))), /*#__PURE__*/React.createElement("div", {
        className: "section"
      }, /*#__PURE__*/React.createElement("div", {
        className: "title"
      }, /*#__PURE__*/React.createElement("label", null, lang.head_temperature.current_temperature)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
        className: "temperature"
      }, temperature))));
      content = /*#__PURE__*/React.createElement(AlertDialog, {
        lang: lang,
        caption: lang.head_temperature.title,
        message: content,
        buttons: buttons
      });
      className = {
        'modal-change-filament': true,
        'shadow-modal': true,
        'head-temperature': true
      };
      return /*#__PURE__*/React.createElement("div", {
        className: "always-top head-temperature",
        ref: "modal"
      }, /*#__PURE__*/React.createElement(Modal, {
        className: className,
        content: content,
        disabledEscapeOnBackground: false
      }));
    }

  }, _temp;
});