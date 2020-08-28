function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define([], function () {
  const React = require('react');

  const {
    createContext
  } = React;
  const RightPanelContext = createContext();

  class RightPanelContextProvider extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "setMode", mode => {
        const {
          mode: currentMode
        } = this.state;

        if (['path-edit'].includes(mode) || currentMode !== mode) {
          this.setState({
            mode
          });
        }
      });

      _defineProperty(this, "setSelectedElement", elems => {
        if (elems !== this.state.selectedElement) {
          document.activeElement.blur();
        }

        this.setState({
          selectedElement: elems
        });
      });

      this.state = {
        mode: 'element',
        selectedElement: null
      };
    }

    render() {
      const {
        setMode,
        setSelectedElement
      } = this;
      const {
        mode,
        selectedElement
      } = this.state;
      return /*#__PURE__*/React.createElement(RightPanelContext.Provider, {
        value: {
          setMode,
          mode,
          setSelectedElement,
          selectedElement
        }
      }, this.props.children);
    }

  }

  ;
  return {
    RightPanelContextProvider,
    RightPanelContext
  };
});