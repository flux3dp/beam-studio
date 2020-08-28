function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

define(['helpers/i18n', 'jsx!views/cloud/sign-in', 'jsx!views/cloud/sign-up', 'jsx!views/cloud/sign-up-success', 'jsx!views/cloud/sign-up-fail', 'jsx!views/cloud/forgot-password', 'jsx!views/cloud/email-sent', 'jsx!views/cloud/bind-machine', 'jsx!views/cloud/bind-success', 'jsx!views/cloud/bind-fail', 'jsx!views/cloud/bind-error', 'jsx!views/cloud/sign-out', 'jsx!views/cloud/change-password', 'jsx!views/cloud/terms', 'jsx!views/cloud/privacy'], function (i18n, SignIn, SignUp, SignUpSuccess, SignUpFail, ForgotPassword, EmailSent, BindMachine, BindSuccess, BindFail, BindError, SignOut, ChangePassword, Terms, Privacy) {
  const React = require('react');

  return function ({
    child
  }) {
    class Cloud extends React.Component {
      constructor(props) {
        super(props);

        _defineProperty(this, "logError", errorArray => {
          this.setState({
            error: errorArray,
            view: 'bind-fail'
          });
        });

        _defineProperty(this, "clear", () => {
          this.setState({
            view: ''
          });
        });

        _defineProperty(this, "renderContent", () => {
          const content = {};
          let view = this.state.view || child;

          content['sign-in'] = () => /*#__PURE__*/React.createElement(SignIn, null);

          content['sign-up'] = () => /*#__PURE__*/React.createElement(SignUp, null);

          content['sign-up-success'] = () => /*#__PURE__*/React.createElement(SignUpSuccess, null);

          content['sign-up-fail'] = () => /*#__PURE__*/React.createElement(SignUpFail, null);

          content['forgot-password'] = () => /*#__PURE__*/React.createElement(ForgotPassword, null);

          content['email-sent'] = () => /*#__PURE__*/React.createElement(EmailSent, null);

          content['bind-machine'] = () => /*#__PURE__*/React.createElement(BindMachine, {
            lang: i18n.lang,
            onError: this.logError
          });

          content['bind-success'] = () => /*#__PURE__*/React.createElement(BindSuccess, null);

          content['bind-fail'] = () => /*#__PURE__*/React.createElement(BindFail, {
            error: this.state.error,
            clear: this.clear
          });

          content['bind-error'] = () => /*#__PURE__*/React.createElement(BindError, null);

          content['change-password'] = () => /*#__PURE__*/React.createElement(ChangePassword, {
            lang: i18n.lang
          });

          content['sign-out'] = () => /*#__PURE__*/React.createElement(SignOut, null);

          content['terms'] = () => /*#__PURE__*/React.createElement(Terms, null);

          content['privacy'] = () => /*#__PURE__*/React.createElement(Privacy, null);

          if (typeof content[view] === 'undefined') {
            view = 'sign-in';
          }

          return content[view]();
        });
      }

      UNSAFE_componentWillUpdate(nextProps, nextState) {
        console.log('test next props', nextProps, nextState, this.props, this.state);
      }

      render() {
        return /*#__PURE__*/React.createElement("div", {
          className: "studio-container settings-cloud"
        }, /*#__PURE__*/React.createElement("div", {
          className: "cloud"
        }, this.renderContent()));
      }

    }

    ;
    return Cloud;
  };
});