function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['jquery', 'reactPropTypes', 'reactClassset', 'helpers/shortcuts', 'reactCreateReactClass'], function ($, PropTypes, ReactCx, shortcuts) {
  const React = require('react');

  const ReactDOM = require('react-dom');

  class View extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "onOpen", () => {
        if (this.props.onOpen) {
          this.props.onOpen(this);
        }
      });

      _defineProperty(this, "_onClose", e => {
        ReactDOM.unmountComponentAtNode(View);
        this.props.onClose(e);
      });

      _defineProperty(this, "_onEscapeOnBackground", e => {
        var self = this;

        if (false === self.props.disabledEscapeOnBackground) {
          self.props.onClose(e);
        }
      });
    }

    componentDidMount() {
      var self = this;
      self.onOpen();
      shortcuts.on(['esc'], function (e) {
        if (false === self.props.disabledEscapeOnBackground) {
          self.props.onClose(e);
        }
      });
    }

    componentWillUnmount() {
      shortcuts.off(['esc']);

      if (window.svgEditor) {
        shortcuts.on(['esc'], svgEditor.clickSelect);
      }
    }

    render() {
      var backgroundClass;
      this.props.className['modal-window'] = true;
      backgroundClass = ReactCx.cx(this.props.className);
      return /*#__PURE__*/React.createElement("div", {
        className: backgroundClass
      }, /*#__PURE__*/React.createElement("div", {
        className: "modal-background",
        onClick: this._onEscapeOnBackground
      }), /*#__PURE__*/React.createElement("div", {
        className: "modal-body"
      }, this.props.children || this.props.content));
    }

  }

  ;
  View.propTypes = {
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    content: PropTypes.element,
    className: PropTypes.object
  };
  View.defaultProps = {
    onOpen: function () {},
    onClose: function () {},
    content: /*#__PURE__*/React.createElement("div", null),
    disabledEscapeOnBackground: false,
    className: {}
  };
  return View;
});