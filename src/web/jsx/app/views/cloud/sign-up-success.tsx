define(['helpers/i18n'], function (i18n) {
  const React = require('react');

  const LANG = i18n.lang.settings.flux_cloud;
  return () => {
    const _handleSignIn = () => location.hash = '#studio/cloud/sign-in';

    return /*#__PURE__*/React.createElement("div", {
      className: "cloud"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container"
    }, /*#__PURE__*/React.createElement("div", {
      className: "icon"
    }, /*#__PURE__*/React.createElement("img", {
      src: "http://placehold.it/150x150"
    })), /*#__PURE__*/React.createElement("div", {
      className: "title no-margin"
    }, /*#__PURE__*/React.createElement("h3", null, LANG.sign_up), /*#__PURE__*/React.createElement("h2", null, LANG.success)), /*#__PURE__*/React.createElement("div", {
      className: "description"
    }, /*#__PURE__*/React.createElement("label", null, LANG.pleaseSignIn))), /*#__PURE__*/React.createElement("div", {
      className: "footer"
    }, /*#__PURE__*/React.createElement("div", {
      className: "divider"
    }, /*#__PURE__*/React.createElement("hr", null)), /*#__PURE__*/React.createElement("div", {
      className: "actions"
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn btn-default",
      onClick: _handleSignIn
    }, LANG.sign_in))));
  };
});