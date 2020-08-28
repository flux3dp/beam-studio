define(['helpers/i18n', 'helpers/device-master', 'helpers/device-error-handler'], function (i18n, DeviceMaster, DeviceErrorHandler) {
  const React = require('react');

  const LANG = i18n.lang.settings.flux_cloud;
  return ({
    error,
    clear
  }) => {
    const _handleBackToList = () => {
      clear();
      setTimeout(() => {
        location.hash = '#studio/cloud/bind-machine';
      }, 10);
    };

    const _handleCancel = () => location.hash = '#studio/print';

    const message = Boolean(error) ? DeviceErrorHandler.translate(error) : LANG.binding_error_description;
    return /*#__PURE__*/React.createElement("div", {
      className: "cloud bind-success"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container"
    }, /*#__PURE__*/React.createElement("div", {
      className: "title"
    }, /*#__PURE__*/React.createElement("h3", null, LANG.binding_fail), /*#__PURE__*/React.createElement("label", null, message)), /*#__PURE__*/React.createElement("div", {
      className: "icon"
    }, /*#__PURE__*/React.createElement("img", {
      src: "img/error-icon.svg"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "footer"
    }, /*#__PURE__*/React.createElement("div", {
      className: "divider"
    }, /*#__PURE__*/React.createElement("hr", null)), /*#__PURE__*/React.createElement("div", {
      className: "actions"
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn btn-cancel",
      onClick: _handleCancel
    }, LANG.cancel), /*#__PURE__*/React.createElement("button", {
      className: "btn btn-default",
      onClick: _handleBackToList
    }, LANG.back_to_list))));
  };
});