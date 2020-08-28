function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define([], function () {
  const React = require('react');

  const {
    createContext
  } = React;
  const ZoomBlockContext = createContext();

  class ZoomBlockContextProvider extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "updateZoomBlock", () => {
        this.setState(this.state);
      });

      this.state = {};
    }

    render() {
      const {
        updateZoomBlock
      } = this;
      return /*#__PURE__*/React.createElement(ZoomBlockContext.Provider, {
        value: {
          updateZoomBlock
        }
      }, this.props.children);
    }

  }

  ;
  return {
    ZoomBlockContextProvider,
    ZoomBlockContext
  };
});