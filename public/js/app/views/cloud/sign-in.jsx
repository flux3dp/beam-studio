define([
    'helpers/i18n',
    'helpers/sprintf',
    'helpers/api/cloud',
    'plugins/classnames/index'
], function(
    i18n,
    Sprintf,
    CloudApi,
    ClassNames
) {
    const React = require('react');
    const LANG = i18n.lang.settings.flux_cloud;
    return class SignIn extends React.Component{
        constructor(props) {
            super(props);
            this.state = {
                email: '',
                password: '',
                processing: false,
                showResendVerificationEmail: false
            };
        }

        async componentDidMount() {
            const response = await CloudApi.getMe();
            if(response.ok) {
                const responseBody = response.json();
                if(responseBody) {
                    location.hash = '#/studio/cloud/bind-machine';
                }
            }
        }

        _handleForgotPassword = () => {
            location.hash = '#/studio/cloud/forgot-password';
        }

        _handleEditValue = (e) => {
            let { id, value } = e.target;
            this.setState({
                [id]: value
            });
        }

        _handleDetectEnterKey = (e) => {
            if(e.key === 'Enter') {
                this._handleSignIn(e);
            }
        }

        _handleCancel = () => {
            location.hash = '#/studio/print';
        }

        _handleResendVerificationEmail = async () => {
            let { email } = this.state;

            const response = await CloudApi.resendVerification(email);
            if(response.ok) {
                location.hash = '#studio/cloud/email-sent';
            }
            else {
                alert(LANG.contact_us);
            }
        }

        _handleSignIn = async (e) => {
            e.preventDefault();
            let { email, password } = this.state;

            this.setState({
                errorMessage: '',
                processing: true
            });

            const response = await CloudApi.signIn(email, password);
            const responseBody = await response.json();
            if(response.ok) {
                const { nickname } = responseBody;
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
        }

        render() {
            const verificationClass = ClassNames('resend', {hide: !this.state.showResendVerificationEmail });
            const message = (this.state.processing) ? LANG.processing : '';

            return(
                <div className='cloud'>
                    <div className='container'>
                        <div className='title'>
                            <h3>{LANG.sign_in}</h3>
                            <h2>{LANG.flux_cloud}</h2>
                        </div>
                        <div className='controls'>
                            <div>
                                <input id='email' type='text' placeholder='Email' onChange={this._handleEditValue} />
                            </div>
                            <div>
                                <input id='password' type='password' placeholder='Password' onChange={this._handleEditValue} onKeyPress={this._handleDetectEnterKey} />
                            </div>
                            <div className='forget-password'>
                                <a href='#/studio/cloud/forgot-password'>{LANG.forgot_password}</a>
                            </div>
                            <div className='sign-up-description' dangerouslySetInnerHTML={
                                {__html: Sprintf(LANG.sign_up_statement, '#/studio/cloud/sign-up')}
                            } />
                        </div>
                        <div className='processing-error'>
                            <label>{this.state.errorMessage}</label><br/>
                            <a className={verificationClass} onClick={this._handleResendVerificationEmail}>{LANG.resend_verification}</a>
                        </div>
                    </div>
                    <div className='processing'>
                        <label>{message}</label>
                    </div>
                    <div className='footer'>
                        <div className='divider'>
                            <hr />
                        </div>
                        <div className='actions'>
                            <button className='btn btn-cancel' onClick={this._handleCancel}>{LANG.back}</button>
                            <button className='btn btn-default' onClick={this._handleSignIn}>{LANG.sign_in}</button>
                        </div>
                    </div>
                </div>
            );
        }

    };

});
