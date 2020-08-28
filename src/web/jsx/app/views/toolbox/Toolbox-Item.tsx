define([], function () {
  const React = require('react');

  class ToolboxItem extends React.Component {
    constructor() {
      super();
    }

    render() {
      return /*#__PURE__*/React.createElement("div", {
        onClick: this.props.onClick,
        className: "toolbox-item",
        title: this.props.title
      }, /*#__PURE__*/React.createElement("img", {
        src: this.props.src
      }));
    }

  }

  return ToolboxItem;
});