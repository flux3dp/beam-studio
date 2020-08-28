function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define([], function () {
  const React = require('react');

  const {
    createContext
  } = React;
  const ObjectPanelContext = createContext();
  const minRenderInterval = 200;

  class ObjectPanelContextProvider extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "updateDimensionValues", newValues => {
        this.dimensionValues = { ...this.dimensionValues,
          ...newValues
        };
      });

      _defineProperty(this, "getDimensionValues", key => {
        if (key) {
          return this.dimensionValues[key];
        }

        return this.dimensionValues;
      });

      _defineProperty(this, "updateObjectPanel", () => {
        clearTimeout(this.updateTimeout);
        const time = Date.now();
        const {
          lastUpdateTime
        } = this.state;

        if (time - lastUpdateTime >= minRenderInterval) {
          this.setState({
            lastUpdateTime: time
          });
        } else {
          this.updateTimeout = setTimeout(() => {
            this.setState({
              lastUpdateTime: lastUpdateTime + minRenderInterval
            });
          }, lastUpdateTime + minRenderInterval - time);
        }
      });

      this.dimensionValues = {};
      this.state = {
        lastUpdateTime: Date.now()
      };
    }

    componentDidUpdate() {}

    render() {
      const {
        dimensionValues,
        updateDimensionValues,
        getDimensionValues,
        updateObjectPanel
      } = this;
      return /*#__PURE__*/React.createElement(ObjectPanelContext.Provider, {
        value: {
          dimensionValues,
          updateDimensionValues,
          getDimensionValues,
          updateObjectPanel
        }
      }, this.props.children);
    }

  }

  ;
  return {
    ObjectPanelContextProvider,
    ObjectPanelContext
  };
});