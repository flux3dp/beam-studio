define(['helpers/i18n', 'helpers/device-master'], function (i18n, DeviceMaster) {
  const React = require('react');

  const LANG = i18n.lang.settings.flux_cloud;
  return () => {
    const _handleDownloadError = async e => {
      e.preventDefault();
      const info = await DeviceMaster.downloadErrorLog();
      saveAs(info[1], 'error-log.txt');
    };

    const _handleCancel = () => location.hash = '#studio/print';

    return /*#__PURE__*/React.createElement("div", {
      className: "cloud bind-success"
    }, /*#__PURE__*/React.createElement("div", {
      className: "container"
    }, /*#__PURE__*/React.createElement("div", {
      className: "title"
    }, /*#__PURE__*/React.createElement("h3", null, LANG.binding_fail), /*#__PURE__*/React.createElement("label", null, LANG.binding_error_description)), /*#__PURE__*/React.createElement("div", {
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
      onClick: _handleDownloadError
    }, LANG.retrieve_error_log))));
  };
});