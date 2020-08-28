define(['app/actions/beambox/svgeditor-function-wrapper', 'app/stores/topbar-store', 'jsx!views/toolbox/Toolbox-Item', 'helpers/i18n'], function (FnWrapper, TopbarStore, ToolboxItem, i18n) {
  const React = require('react');

  const LANG = i18n.lang.beambox.toolbox;

  class Toolbox extends React.Component {
    constructor() {
      super();
      this.state = {
        showAlign: false,
        showDistribute: false,
        showImage: false
      };
    }

    componentDidMount() {
      TopbarStore.onAlignToolboxShowed(() => this.showAlign());
      TopbarStore.onAlignToolboxClosed(() => this.closeAlign());
      TopbarStore.onDistributeToolboxShowed(() => this.showDistribute());
      TopbarStore.onDistributeToolboxClosed(() => this.closeDistribute());
      TopbarStore.onImageToolboxShowed(() => this.showImage());
      TopbarStore.onImageToolboxClosed(() => this.closeImage());
    }

    componentWillUnmount() {
      TopbarStore.removeAlignToolboxShowedListener(() => this.showAlign());
      TopbarStore.removeAlignToolboxClosedListener(() => this.closeAlign());
      TopbarStore.removeDistributeToolboxShowedListener(() => this.showDistribute());
      TopbarStore.removeDistributeToolboxClosedListener(() => this.closeDistribute());
      TopbarStore.removeImageToolboxShowedListener(() => this.showImage());
      TopbarStore.removeImageToolboxClosedListener(() => this.closeImage());
    }

    showDistribute() {
      if (!this.state.showDistribute) {
        this.setState({
          showDistribute: true
        });
      }
    }

    closeDistribute() {
      if (this.state.showDistribute) {
        this.setState({
          showDistribute: false
        });
      }
    }

    showAlign() {
      if (!this.state.showAlign) {
        this.setState({
          showAlign: true
        });
      }
    }

    closeAlign() {
      if (this.state.showAlign) {
        this.setState({
          showAlign: false
        });
      }
    }

    showImage() {
      if (!this.state.showImage) {
        this.setState({
          showImage: true
        });
      }
    }

    closeImage() {
      if (this.state.showImage) {
        this.setState({
          showImage: false
        });
      }
    }

    renderElement() {
      let alignToolbox = null,
          distributeToolbox = null,
          imageToolbox = null;

      if (this.state.showAlign) {
        alignToolbox = /*#__PURE__*/React.createElement("div", {
          className: "Toolbox-content"
        }, /*#__PURE__*/React.createElement(ToolboxItem, {
          onClick: FnWrapper.alignLeft,
          src: "img/beambox/align-left.png",
          title: LANG.ALIGN_LEFT
        }), /*#__PURE__*/React.createElement(ToolboxItem, {
          onClick: FnWrapper.alignCenter,
          src: "img/beambox/align-center-horizontal.png",
          title: LANG.ALIGN_CENTER
        }), /*#__PURE__*/React.createElement(ToolboxItem, {
          onClick: FnWrapper.alignRight,
          src: "img/beambox/align-right.png",
          title: LANG.ALIGN_RIGHT
        }), /*#__PURE__*/React.createElement(ToolboxItem, {
          onClick: FnWrapper.alignTop,
          src: "img/beambox/align-top.png",
          title: LANG.ALIGN_TOP
        }), /*#__PURE__*/React.createElement(ToolboxItem, {
          onClick: FnWrapper.alignMiddle,
          src: "img/beambox/align-center-vertical.png",
          title: LANG.ALIGN_MIDDLE
        }), /*#__PURE__*/React.createElement(ToolboxItem, {
          onClick: FnWrapper.alignBottom,
          src: "img/beambox/align-bottom.png",
          title: LANG.ALIGN_BOTTOM
        }));
      }

      if (this.state.showDistribute) {
        distributeToolbox = /*#__PURE__*/React.createElement("div", {
          className: "Toolbox-content"
        }, /*#__PURE__*/React.createElement(ToolboxItem, {
          onClick: FnWrapper.distHori,
          src: "img/beambox/arrange-horizontal.png",
          title: LANG.ARRANGE_HORIZONTAL
        }), /*#__PURE__*/React.createElement(ToolboxItem, {
          onClick: FnWrapper.distVert,
          src: "img/beambox/arrange-vertical.png",
          title: LANG.ARRANGE_VERTICAL
        }), /*#__PURE__*/React.createElement(ToolboxItem, {
          onClick: FnWrapper.distEven,
          src: "img/beambox/diffusion2.png",
          title: LANG.ARRANGE_DIAGONAL
        }));
      }

      if (this.state.showImage) {
        imageToolbox = /*#__PURE__*/React.createElement("div", {
          className: "Toolbox-content"
        }, /*#__PURE__*/React.createElement(ToolboxItem, {
          onClick: FnWrapper.flipHorizontal,
          src: "img/beambox/flip-horizontal.png",
          title: LANG.FLIP
        }), /*#__PURE__*/React.createElement(ToolboxItem, {
          onClick: FnWrapper.flipVertical,
          src: "img/beambox/flip-vertical.png",
          title: LANG.FLIP
        }));
      }

      if (this.state.showAlign) {
        return /*#__PURE__*/React.createElement("div", {
          className: "toolbox"
        }, alignToolbox, distributeToolbox, imageToolbox);
      } else {
        return null;
      }
    }

    render() {
      const renderElement = this.renderElement();
      return renderElement;
    }

  }

  return Toolbox;
});