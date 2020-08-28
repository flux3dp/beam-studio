function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['helpers/i18n', 'helpers/api/cloud'], function (i18n, CloudApi) {
  var _temp;

  const React = require('react');

  const LANG = i18n.lang.settings.flux_cloud;
  return _temp = class ForgotPassword extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_handleEnterEmail", e => {
        this.setState({
          email: e.target.value
        });
      });

      _defineProperty(this, "_handleBack", () => {
        location.hash = '#studio/cloud/sign-in';
      });

      _defineProperty(this, "_handleNext", async () => {
        const response = await CloudApi.resetPassword(this.state.email);

        if (response.ok) {
          location.hash = '#studio/cloud/email-sent';
        } else {
          alert(LANG.contact_us);
        }
      });

      this.state = {
        email: ''
      };
    }

    render() {
      return /*#__PURE__*/React.createElement("div", {
        className: "cloud"
      }, /*#__PURE__*/React.createElement("div", {
        className: "container forgot-password"
      }, /*#__PURE__*/React.createElement("div", {
        className: "middle"
      }, /*#__PURE__*/React.createElement("div", {
        className: "description"
      }, /*#__PURE__*/React.createElement("h3", null, LANG.enter_email)), /*#__PURE__*/React.createElement("div", {
        className: "controls"
      }, /*#__PURE__*/React.createElement("div", {
        className: "control"
      }, /*#__PURE__*/React.createElement("input", {
        type: "text",
        placeholder: "Email",
        onBlur: this._handleEnterEmail
      }))))), /*#__PURE__*/React.createElement("div", {
        className: "footer"
      }, /*#__PURE__*/React.createElement("div", {
        className: "divider"
      }, /*#__PURE__*/React.createElement("hr", null)), /*#__PURE__*/React.createElement("div", {
        className: "actions"
      }, /*#__PURE__*/React.createElement("button", {
        className: "btn btn-cancel",
        onClick: this._handleBack
      }, LANG.back), /*#__PURE__*/React.createElement("button", {
        className: "btn btn-default",
        onClick: this._handleNext
      }, LANG.next))));
    }

  }, _temp;
});