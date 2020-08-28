define([
    'helpers/api/cloud'
], function(
    CloudApi
) {
    const React = require('react');

    const Controls = (props) => {
        const _handleEntered = e => props.onEntered(props.id, e.target.value);
        const {label, errorMessage, errorOn, type} = props;
        return (
            <div className="controls">
                <div className="label">{label}</div>
                <div className="control">
                    <input type={type || 'text'} onBlur={_handleEntered} />
                </div>
                <div className="error">
                    {errorOn ? errorMessage : ' '}
                </div>
            </div>
        );
    };

    return class changePassword extends React.Component{
        constructor(props) {
            super(props);
            this.values = {
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            };
            this.state = {
                currentPasswordError: '',
                newPasswordError: '',
                confirmPasswordError: '',
                passwordMismatch: false,
                emptyCurrentPassword: false,
                emptyNewPassword: false,
                emptyConfirmPassword: false
            };
        }

        async componentDidMount() {
            const resp = await CloudApi.getMe();
            if(!resp.ok) {
                location.hash = '#/studio/cloud';
            }
        }

        _checkValue = (id, value) => {
            const lang = this.props.lang.settings.flux_cloud,
                f = {};

            f['currentPassword'] = () => {
                this.values['currentPassword'] = value;
                this.setState({
                    emptyCurrentPassword: value === '',
                    currentPasswordError: value === '' ? lang.empty_password_warning : ''
                });

            };

            f['newPassword'] = () => {
                this.values['newPassword'] = value;
                this.setState({
                    emptyNewPassword: value === '',
                    newPasswordError: value === '' ? lang.empty_password_warning : ''
                });
            };

            f['confirmPassword'] = () => {
                this.values['confirmPassword'] = value;
                this.setState({
                    emptyConfirmPassword: value === '',
                    confirmPasswordError: value === '' ? lang.empty_password_warning : ''
                });
            };

            if(typeof f[id] !== 'undefined') {
                f[id]();
            };

            if(this.values.newPassword !== '' && this.values.confirmPassword !== '') {
                const mismatch = this.values.newPassword !== this.values.confirmPassword;
                this.setState({ confirmPasswordError: mismatch ? lang.error_password_not_match : ''});
            }
        }

        allValid = () => {
            const { currentPasswordError, newPasswordError, confirmPasswordError } = this.state;
            return (
                currentPasswordError === '' &&
                newPasswordError === '' &&
                confirmPasswordError === ''
            );
        }

        _handleCancel = () => {
            location.hash = '#/studio/cloud/bind-machine';
        }

        _handleChangePassword = async () => {
            if(!this.allValid()) { return; }
            let lang = this.props.lang.settings.flux_cloud;

            const info = {
                password: this.values.newPassword,
                oldPassword: this.values.currentPassword
            };

            const j = (await CloudApi.changePassword(info)).json();
            if(j.status === 'error') {
                this.setState({ responseError: lang[j.message] });
            } else {
                location.hash = '#/studio/cloud/bind-machine';
            }
        }

        render() {
            const lang = this.props.lang.settings.flux_cloud;

            return (
                <div className="cloud">
                    <div className="change-password container">
                        <div className="title">
                            <h3>{lang.change_password.toUpperCase()}</h3>
                        </div>
                        <div className="row">
                            <Controls
                                id="currentPassword"
                                type="password"
                                label={lang.current_password}
                                errorMessage={this.state.currentPasswordError}
                                errorOn={this.state.currentPasswordError !== ''}
                                onEntered={this._checkValue}
                            />
                        </div>
                        <div className="row">
                            <Controls
                                id="newPassword"
                                type="password"
                                label={lang.new_password}
                                errorMessage={this.state.newPasswordError}
                                errorOn={this.state.newPasswordError !== ''}
                                onEntered={this._checkValue}
                            />
                        </div>
                        <div className="row">
                            <Controls
                                id="confirmPassword"
                                type="password"
                                label={lang.confirm_password}
                                errorMessage={this.state.confirmPasswordError}
                                errorOn={this.state.confirmPasswordError !== ''}
                                onEntered={this._checkValue}
                            />
                        </div>
                    </div>
                    <div className="change-password footer">
                        <div className="divider">
                            <span className="error">{this.state.responseError}</span>
                            <hr />
                        </div>
                        <div className="actions">
                            <button className="btn btn-cancel" onClick={this._handleCancel}>{lang.cancel}</button>
                            <button className="btn btn-default" onClick={this._handleChangePassword}>{lang.submit}</button>
                        </div>
                    </div>
                </div>
            );
        }
    };
});
