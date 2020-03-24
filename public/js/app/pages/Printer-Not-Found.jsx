define([
    'app/actions/initialize-machine',
    'helpers/api/discover',
    'helpers/api/upnp-config',
    'helpers/i18n',
    'jsx!widgets/Modal',
    'app/actions/progress-actions',
    'app/constants/progress-constants',
    'app/actions/alert-actions'
], function(
    initializeMachine,
    discover,
    upnpConfig,
    i18n,
    Modal,
    ProgressActions,
    ProgressConstants,
    AlertActions
) {
    const React = require('react');

    'use strict';

    return function(args) {
        var upnpMethods;

        args = args || {};

        class PrinterNotFound extends React.Component{
            constructor(props) {
                super(props);
                this.state = {
                    lang: args.state.lang
                };
            }

            componentWillUnmount = () => {
                if (typeof upnpMethods !== 'undefined') {
                    upnpMethods.connection.close();
                }
            }

            _retrieveDevice = (e) => {
                var self = this,
                    currentPrinter,
                    discoverMethods = discover('upnp-config', (printers) => {
                        clearTimeout(timer);
                        ProgressActions.close();

                        currentPrinter = printers[0] || {};
                        currentPrinter.from = 'WIFI';
                        upnpMethods = upnpConfig(currentPrinter.uuid);

                        discoverMethods.removeListener('upnp-config');

                        // temporary store for setup
                        initializeMachine.settingPrinter.set(currentPrinter);
                        location.hash = '#initialize/wifi/set-printer';
                    }),
                    timer = setTimeout(function() {
                        ProgressActions.close();
                        AlertActions.showPopupError(
                            'retrieve-device-fail',
                            self.state.lang.initialize.errors.not_found
                        );
                        clearTimeout(timer);
                    }, 1000);

                ProgressActions.open(ProgressConstants.NONSTOP);
            }

            render() {
                const lang = this.state.lang;
                const localLang = lang.initialize.notice_from_device;
                const wrapperClassName = {
                        'initialization': true
                    };
                    
                const imgLang = 'en' === i18n.getActiveLang() ? 'en' : 'zh';
                const imgSrc = `img/wifi-error-notify-delta-${imgLang}.png`;
                const content = (
                        <div className="device-not-found text-center">
                            <img className="brand-image" src="img/menu/main_logo.svg"/>
                            <div>
                                <img className="not-found-img" src={imgSrc}/>
                                <div className="button-group btn-v-group">
                                    <button data-ga-event="retry-getting-device-from-wifi" className="btn btn-action btn-large" onClick={this._retrieveDevice}>
                                        {lang.initialize.retry}
                                    </button>
                                    <a href="#initialize/wifi/connect-machine" data-ga-event="back" className="btn btn-link btn-large">
                                        {lang.initialize.back}
                                    </a>
                                </div>
                            </div>
                        </div>
                    );

                return (
                    <Modal className={wrapperClassName} content={content}/>
                );
            }
        };

        return PrinterNotFound;
    };
});
