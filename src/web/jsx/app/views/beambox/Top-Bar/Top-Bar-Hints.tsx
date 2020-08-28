function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['helpers/i18n'], function (i18n) {
  const React = require('react');

  const LANG = i18n.lang.topbar;

  const classNames = require('classnames');

  const {
    createContext
  } = React;
  const HintContext = createContext();
  const ret = {};
  const Constants = {
    POLYGON: 'POLYGON'
  };
  ret.Constants = Constants;

  class HintContextProvider extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "setHint", hintType => {
        this.setState({
          hintType
        });
      });

      _defineProperty(this, "removeHint", () => {
        this.setState({
          hintType: null
        });
      });

      this.state = {
        hintType: null
      };
    }

    render() {
      const {
        setHint,
        removeHint
      } = this;
      const {
        hintType
      } = this.state;
      return /*#__PURE__*/React.createElement(HintContext.Provider, {
        value: {
          setHint,
          removeHint,
          hintType
        }
      }, this.props.children);
    }

  }

  class HintContextConsumer extends React.Component {
    componentDidMount() {
      ret.contextCaller = this.context;
    }

    componentWillUnmount() {
      ret.contextCaller = null;
    }

    renderTextHint(textContent) {
      return /*#__PURE__*/React.createElement("div", null, textContent);
    }

    renderContent() {
      const {
        hintType
      } = this.context;

      if (!hintType) {
        return null;
      }

      if (hintType === Constants.POLYGON) {
        return this.renderTextHint(LANG.hint.polygon);
      } else {
        return null;
      }
    }

    render() {
      return /*#__PURE__*/React.createElement("div", {
        className: "hint-container"
      }, this.renderContent());
    }

  }

  ;
  HintContextConsumer.contextType = HintContext;

  class TopBarHints extends React.Component {
    render() {
      return /*#__PURE__*/React.createElement(HintContextProvider, null, /*#__PURE__*/React.createElement(HintContextConsumer, null));
    }

  }

  ret.TopBarHints = TopBarHints;
  return ret;
});