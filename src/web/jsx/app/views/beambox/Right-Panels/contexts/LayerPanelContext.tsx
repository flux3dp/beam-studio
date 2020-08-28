function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define([], function () {
  const React = require('react');

  const {
    createContext
  } = React;
  const LayerPanelContext = createContext();

  class LayerPanelContextProvider extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "updateLayerPanel", () => {
        this.setState(this.state);
      });

      this.state = {};
    }

    render() {
      const {
        updateLayerPanel
      } = this;
      return /*#__PURE__*/React.createElement(LayerPanelContext.Provider, {
        value: {
          updateLayerPanel
        }
      }, this.props.children);
    }

  }

  ;
  return {
    LayerPanelContextProvider,
    LayerPanelContext
  };
});