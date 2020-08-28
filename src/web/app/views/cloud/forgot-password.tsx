define([
    'helpers/i18n',
    'helpers/api/cloud'
], function(
    i18n,
    CloudApi
) {
    const React = require('react');
    const LANG = i18n.lang.settings.flux_cloud;

    return class ForgotPassword extends React.Component{
        constructor(props) {
            super(props);
            this.state = {
                email: ''
            };
        }

        _handleEnterEmail = (e) => {
            this.setState({ email: e.target.value });
        }

        _handleBack = () => {
            location.hash = '#studio/cloud/sign-in';
        }

        _handleNext = async () => {
            const response = await CloudApi.resetPassword(this.state.email);
            if(response.ok) {
                location.hash = '#studio/cloud/email-sent';
            } else {
                alert(LANG.contact_us);
            }

        }

        render() {
            return(
                <div className="cloud">
                    <div className="container forgot-password">
                        <div className="middle">
                            <div className="description">
                                <h3>{LANG.enter_email}</h3>
                            </div>
                            <div className="controls">
                                <div className="control">
                                    <input type="text" placeholder="Email" onBlur={this._handleEnterEmail} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="footer">
                        <div className="divider">
                            <hr />
                        </div>
                        <div className="actions">
                            <button className="btn btn-cancel" onClick={this._handleBack}>{LANG.back}</button>
                            <button className="btn btn-default" onClick={this._handleNext}>{LANG.next}</button>
                        </div>
                    </div>
                </div>
            );
        }

    };

});
