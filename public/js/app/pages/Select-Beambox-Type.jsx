define([
    'jsx!widgets/Modal',
    'helpers/i18n',
], function (
    Modal,
    i18n
) {
    'use strict';
    const React = require('react');

    const lang = i18n.lang;

    return function () {
        return class SelectBeamboxType extends React.Component{

            _renderSelectMachineStep = () => {
                return (
                    <div className="select-machine-type">
                        <h1 className="main-title">{lang.initialize.select_beambox_type}</h1>
                        <div className="btn-h-group">
                            <button
                                className="btn btn-action btn-large"
                                onClick={() => location.hash = '#initialize/connect/connect-beambox'}
                            >
                                <p className="subtitle">Beambox</p>
                            </button>
                            <button
                                className="btn btn-action btn-large"
                                onClick={() => location.hash = '#initialize/connect/connect-beambox#Pro' }
                            >
                                <p className="subtitle">Beambox Pro</p>
                            </button>
                        </div>
                    </div>
                );
            }



            render() {
                const wrapperClassName = {
                    'initialization': true
                };
                const innerContent = this._renderSelectMachineStep();
                const content = (
                    <div className="connect-machine text-center">
                        <img className="brand-image" src="img/menu/main_logo.svg" />
                        <div className="connecting-means">
                            {innerContent}
                            <a href="#initialize/connect/setup-complete/with-usb" data-ga-event="skip" className="btn btn-link btn-large">
                                {lang.initialize.no_machine}
                            </a>
                        </div>
                    </div>
                );

                return (
                    <Modal className={wrapperClassName} content={content} />
                );
            }

        };
    };
});
