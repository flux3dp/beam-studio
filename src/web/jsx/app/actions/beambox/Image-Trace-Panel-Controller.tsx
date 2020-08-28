define(['jsx!views/beambox/Image-Trace-Panel', 'reactCreateReactClass'], function (ImageTracePanel) {
  const React = require('react');

  const ReactDOM = require('react-dom');

  class ImageTracePanelController {
    constructor() {
      this.reactRoot = '';
    }

    init(reactRoot) {
      this.reactRoot = reactRoot;
    }

    render() {
      ReactDOM.render( /*#__PURE__*/React.createElement(ImageTracePanel, null), document.getElementById(this.reactRoot));
    }

  }

  const instance = new ImageTracePanelController();
  return instance;
});