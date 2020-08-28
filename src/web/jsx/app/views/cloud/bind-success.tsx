define(['helpers/i18n'], function (i18n) {
  const React = require('react');

  let LANG = i18n.lang.settings.flux_cloud;
  return () => {
    const _handleBindAnother = () => location.hash = '#studio/cloud/bind-machine';

    const _handleDone = () => location.hash = '#studio/print';

    return /*#__PURE__*/React.createElement("div", {
      className: "cloud bind-success"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container"
    }, /*#__PURE__*/React.createElement("div", {
      className: "title"
    }, /*#__PURE__*/React.createElement("h3", null, LANG.binding_success), /*#__PURE__*/React.createElement("label", null, LANG.binding_success_description)), /*#__PURE__*/React.createElement("div", {
      className: "icon"
    }, /*#__PURE__*/React.createElement("img", {
      src: "img/ok-icon.svg"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "footer"
    }, /*#__PURE__*/React.createElement("div", {
      className: "divider"
    }, /*#__PURE__*/React.createElement("hr", null)), /*#__PURE__*/React.createElement("div", {
      className: "actions"
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn btn-cancel",
      onClick: _handleBindAnother
    }, LANG.bind_another), /*#__PURE__*/React.createElement("button", {
      className: "btn btn-default",
      onClick: _handleDone
    }, LANG.done))));
  };
});