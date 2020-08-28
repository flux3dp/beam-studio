function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const {
  nodeName
} = require('jquery');

define([], function () {
  const React = require('react');

  const {
    createContext
  } = React;
  const TopBarContext = createContext();

  class TopBarContextProvider extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "updateTopBar", () => {
        this.setState(this.state);
      });

      _defineProperty(this, "setHasUnsavedChange", hasUnsavedChange => {
        this.setState({
          hasUnsavedChange
        });
      });

      _defineProperty(this, "setElement", elem => {
        this.setState({
          selectedElem: elem
        });
      });

      _defineProperty(this, "setFileName", fileName => {
        this.setState({
          fileName
        });
      });

      _defineProperty(this, "setPreviewModeIsDrawing", isDrawing => {
        this.setState({
          isDrawing
        });
      });

      _defineProperty(this, "setPreviewModeIsDrawn", isDrawn => {
        this.setState({
          isDrawn
        });
      });

      _defineProperty(this, "setTopBarPreviewMode", isPreviewMode => {
        this.isPreviewMode = isPreviewMode;
      });

      _defineProperty(this, "getTopBarPreviewMode", () => {
        return this.isPreviewMode;
      });

      _defineProperty(this, "setShouldStartPreviewController", shouldStartPreviewController => {
        this.setState({
          shouldStartPreviewController
        });
      });

      this.state = {
        fileName: null,
        selectedElem: null,
        hasUnsavedChange: false,
        isDrawing: false,
        isDrawn: false
      };
    }

    render() {
      const {
        updateTopBar,
        setElement,
        setFileName,
        setHasUnsavedChange,
        setTopBarPreviewMode,
        getTopBarPreviewMode,
        setShouldStartPreviewController,
        isPreviewMode
      } = this;
      const {
        fileName,
        selectedElem,
        hasUnsavedChange,
        shouldStartPreviewController
      } = this.state;
      return /*#__PURE__*/React.createElement(TopBarContext.Provider, {
        value: {
          updateTopBar,
          setElement,
          setFileName,
          setHasUnsavedChange,
          setTopBarPreviewMode,
          getTopBarPreviewMode,
          setShouldStartPreviewController,
          isPreviewMode,
          fileName,
          selectedElem,
          hasUnsavedChange,
          shouldStartPreviewController
        }
      }, this.props.children);
    }

  }

  ;
  return {
    TopBarContextProvider,
    TopBarContext
  };
});