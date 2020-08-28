define(['helpers/i18n', 'helpers/sprintf'], function (i18n, Sprintf) {
  const React = require('react');

  const LANG = i18n.lang.settings.flux_cloud;
  return () => {
    const _handleCancel = () => location.hash = '#studio/print';

    const _handleRetry = () => location.hash = '#studio/cloud/sign-up';

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
    }, /*#__PURE__*/React.createElement("h3", null, LANG.sign_up), /*#__PURE__*/React.createElement("h2", null, LANG.fail)), /*#__PURE__*/React.createElement("div", {
      className: "description"
    }, /*#__PURE__*/React.createElement("div", {
      className: "sign-up-description",
      dangerouslySetInnerHTML: {
        __html: Sprintf(LANG.try_sign_up_again, '#/studio/cloud/sign-up')
      }
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
      onClick: _handleRetry
    }, LANG.try_again))));
  };
});