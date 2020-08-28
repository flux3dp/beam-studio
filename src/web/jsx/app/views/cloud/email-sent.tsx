define(['helpers/i18n'], function (i18n) {
  const React = require('react');

  const LANG = i18n.lang.settings.flux_cloud;
  return () => {
    const _handleDone = () => location.hash = '#studio/cloud';

    return /*#__PURE__*/React.createElement("div", {
      className: "cloud"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container email-sent"
    }, /*#__PURE__*/React.createElement("div", {
      className: "middle"
    }, /*#__PURE__*/React.createElement("div", {
      className: "description"
    }, /*#__PURE__*/React.createElement("h3", null, LANG.check_inbox)))), /*#__PURE__*/React.createElement("div", {
      className: "footer"
    }, /*#__PURE__*/React.createElement("div", {
      className: "divider"
    }, /*#__PURE__*/React.createElement("hr", null)), /*#__PURE__*/React.createElement("div", {
      className: "actions"
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn btn-default",
      onClick: _handleDone
    }, LANG.done))));
  };
});