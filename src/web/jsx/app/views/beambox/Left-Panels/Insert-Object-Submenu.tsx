define(['app/actions/beambox/svgeditor-function-wrapper', 'helpers/shortcuts', 'helpers/i18n'], function (FnWrapper, Shortcuts, i18n) {
  const React = require('react');

  const LANG = i18n.lang.beambox.left_panel.insert_object_submenu;
  return class InsertObjectSubmenu extends React.Component {
    componentDidMount() {
      Shortcuts.on(['esc'], () => this.props.onClose());
    }

    componentWillUnmount() {
      Shortcuts.off(['esc']);
    }

    render() {
      return /*#__PURE__*/React.createElement("div", {
        className: "dialog-window",
        style: {
          display: 'flex'
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: "arrow arrow-left"
      }), /*#__PURE__*/React.createElement("div", {
        className: "dialog-window-content"
      }, /*#__PURE__*/React.createElement("ul", {
        onClick: () => this.props.onClose(),
        style: {
          margin: '0px'
        }
      }, /*#__PURE__*/React.createElement("li", {
        onClick: FnWrapper.insertRectangle,
        key: "rectangle"
      }, LANG.rectangle), /*#__PURE__*/React.createElement("li", {
        onClick: FnWrapper.insertEllipse,
        key: "ellipse"
      }, LANG.ellipse), /*#__PURE__*/React.createElement("li", {
        onClick: FnWrapper.insertLine,
        key: "line"
      }, LANG.line), /*#__PURE__*/React.createElement("li", {
        onClick: FnWrapper.importImage,
        key: "image"
      }, LANG.image), /*#__PURE__*/React.createElement("li", {
        onClick: FnWrapper.insertText,
        key: "text"
      }, LANG.text), /*#__PURE__*/React.createElement("li", {
        onClick: FnWrapper.insertPath,
        key: "path"
      }, LANG.path), /*#__PURE__*/React.createElement("li", {
        onClick: FnWrapper.insertPolygon,
        key: "polygon"
      }, LANG.polygon))));
    }

  };
});