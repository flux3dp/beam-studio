function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['helpers/i18n', 'helpers/sprintf', 'helpers/api/cloud', 'plugins/classnames/index'], function (i18n, Sprintf, CloudApi, ClassNames) {
  var _temp;

  const React = require('react');

  const LANG = i18n.lang.settings.flux_cloud;
  return _temp = class SignIn extends React.Component {
    constructor(props) {
      super(props);

      _defineProperty(this, "_handleForgotPassword", () => {
        location.hash = '#/studio/cloud/forgot-password';
      });

      _defineProperty(this, "_handleEditValue", e => {
        let {
          id,
          value
        } = e.target;
        this.setState({
          [id]: value
        });
      });

      _defineProperty(this, "_handleDetectEnterKey", e => {
        if (e.key === 'Enter') {
          this._handleSignIn(e);
        }
      });

      _defineProperty(this, "_handleCancel", () => {
        location.hash = '#/studio/print';
      });

      _defineProperty(this, "_handleResendVerificationEmail", async () => {
        let {
          email
        } = this.state;
        const response = await CloudApi.resendVerification(email);

        if (response.ok) {
          location.hash = '#studio/cloud/email-sent';
        } else {
          alert(LANG.contact_us);
        }
      });

      _defineProperty(this, "_handleSignIn", async e => {
        e.preventDefault();
        let {
          email,
          password
        } = this.state;
        this.setState({
          errorMessage: '',
          processing: true
        });
        const response = await CloudApi.signIn(email, password);
        const responseBody = await response.json();

        if (response.ok) {
          const {
            nickname
          } = responseBody;
          const displayName = nickname || email;
          location.hash = '#/studio/cloud/bind-machine';
        } else {
          if (response.status !== 200) {
            this.setState({
              errorMessage: LANG[responseBody.message.toLowerCase()] || LANG.SERVER_INTERNAL_ERROR,
              processing: false
            });
            return;
          }

          this.setState({
            showResendVerificationEmail: responseBody.message === 'NOT_VERIFIED',
            errorMessage: LANG[responseBody.message.toLowerCase()],
            processing: false
          });
        }
      });

      this.state = {
        email: '',
        password: '',
        processing: false,
        showResendVerificationEmail: false
      };
    }

    async componentDidMount() {
      const response = await CloudApi.getMe();

      if (response.ok) {
        const responseBody = response.json();

        if (responseBody) {
          location.hash = '#/studio/cloud/bind-machine';
        }
      }
    }

    render() {
      const verificationClass = ClassNames('resend', {
        hide: !this.state.showResendVerificationEmail
      });
      const message = this.state.processing ? LANG.processing : '';
      return /*#__PURE__*/React.createElement("div", {
        className: "cloud"
      }, /*#__PURE__*/React.createElement("div", {
        className: "container"
      }, /*#__PURE__*/React.createElement("div", {
        className: "title"
      }, /*#__PURE__*/React.createElement("h3", null, LANG.sign_in), /*#__PURE__*/React.createElement("h2", null, LANG.flux_cloud)), /*#__PURE__*/React.createElement("div", {
        className: "controls"
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
        id: "email",
        type: "text",
        placeholder: "Email",
        onChange: this._handleEditValue
      })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
        id: "password",
        type: "password",
        placeholder: "Password",
        onChange: this._handleEditValue,
        onKeyPress: this._handleDetectEnterKey
      })), /*#__PURE__*/React.createElement("div", {
        className: "forget-password"
      }, /*#__PURE__*/React.createElement("a", {
        href: "#/studio/cloud/forgot-password"
      }, LANG.forgot_password)), /*#__PURE__*/React.createElement("div", {
        className: "sign-up-description",
        dangerouslySetInnerHTML: {
          __html: Sprintf(LANG.sign_up_statement, '#/studio/cloud/sign-up')
        }
      })), /*#__PURE__*/React.createElement("div", {
        className: "processing-error"
      }, /*#__PURE__*/React.createElement("label", null, this.state.errorMessage), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("a", {
        className: verificationClass,
        onClick: this._handleResendVerificationEmail
      }, LANG.resend_verification))), /*#__PURE__*/React.createElement("div", {
        className: "processing"
      }, /*#__PURE__*/React.createElement("label", null, message)), /*#__PURE__*/React.createElement("div", {
        className: "footer"
      }, /*#__PURE__*/React.createElement("div", {
        className: "divider"
      }, /*#__PURE__*/React.createElement("hr", null)), /*#__PURE__*/React.createElement("div", {
        className: "actions"
      }, /*#__PURE__*/React.createElement("button", {
        className: "btn btn-cancel",
        onClick: this._handleCancel
      }, LANG.back), /*#__PURE__*/React.createElement("button", {
        className: "btn btn-default",
        onClick: this._handleSignIn
      }, LANG.sign_in))));
    }

  }, _temp;
});