function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['reactPropTypes', 'app/constants/global-constants', 'app/constants/device-constants'], (PropTypes, GlobalConstants, DeviceConstants) => {
  const React = require('react');

  class MonitorHeader extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_renderNavigation", () => {
        let {
          Monitor,
          Device
        } = this.props.context.store.getState(),
            history = this.props.history,
            source = this.props.source;

        const back = () => /*#__PURE__*/React.createElement("div", {
          className: "back",
          onClick: this.props.onBackClick
        }, /*#__PURE__*/React.createElement("i", {
          className: "fa fa-angle-left"
        }));

        const folder = () => /*#__PURE__*/React.createElement("div", {
          className: "back",
          onClick: this.props.onFolderClick
        }, /*#__PURE__*/React.createElement("img", {
          src: "img/folder.svg"
        }));

        const none = () => /*#__PURE__*/React.createElement("div", null);

        if (source === GlobalConstants.DEVICE_LIST) {
          let go = {};

          go[GlobalConstants.CAMERA] = () => {
            return back();
          };

          go[GlobalConstants.CAMERA_RELOCATE] = () => {
            return back();
          };

          go[GlobalConstants.FILE] = () => {
            if (Device.status.st_id === DeviceConstants.status.IDLE) {
              return history.length >= 1 ? back() : none();
            }

            return back();
          };

          if (typeof go[Monitor.mode] === 'function') {
            return go[Monitor.mode]();
          } else {
            return history.length > 1 ? back() : folder();
          }
        } else {
          return Monitor.mode === GlobalConstants.PREVIEW && history.length === 0 ? folder() : back();
        }

        ;
      });

      let {
        store
      } = this.props.context;
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

    render() {
      let nav = this._renderNavigation();

      return /*#__PURE__*/React.createElement("div", {
        className: "header"
      }, /*#__PURE__*/React.createElement("div", {
        className: "title"
      }, /*#__PURE__*/React.createElement("span", null, this.props.name), /*#__PURE__*/React.createElement("div", {
        className: "close",
        onClick: this.props.onCloseClick
      }, /*#__PURE__*/React.createElement("div", {
        className: "x"
      })), nav));
    }

  }

  ;
  MonitorHeader.propTypes = {
    name: PropTypes.string,
    source: PropTypes.string,
    history: PropTypes.array,
    onBackClick: PropTypes.func,
    onFolderClick: PropTypes.func,
    onCloseClick: PropTypes.func
  };
  return MonitorHeader;
});