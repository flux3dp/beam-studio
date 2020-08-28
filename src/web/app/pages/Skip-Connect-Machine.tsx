define([
    'jsx!widgets/Modal',
    'app/actions/beambox/beambox-preference',
    'app/actions/beambox/constant',
    'helpers/i18n',
], function (
    Modal,
    BeamboxPreference,
    Constant,
    i18n
) {
    'use strict';
    const React = require('react');

    const lang = i18n.lang;

    return function () {
        return class SkipConnectMachine extends React.Component{

            onStart = () => {
                if (!localStorage.getItem('printer-is-ready')) {
                    localStorage.setItem('new-user', true);
                }
                localStorage.setItem('printer-is-ready', true);
                location.hash = '#studio/beambox';
                location.reload();
            }

            renderSelectMachineStep = () => {
                return (
                    <div className='skip-connect-machine'>
                        <h1 className='main-title'>{lang.initialize.setting_completed.great}</h1>
                        <div className='text-content'>
                            {lang.initialize.setting_completed.setup_later}
                        </div>
                        <button
                                className='btn btn-action'
                                onClick={() => this.onStart()}
                        >
                            {lang.initialize.setting_completed.ok}
                        </button>
                    </div>
                );
            }

            render() {
                const wrapperClassName = {
                    'initialization': true
                };
                const innerContent = this.renderSelectMachineStep();
                const content = (
                    <div className="connect-machine">
                        <div className="top-bar"/>
                        {innerContent}
                    </div>
                );

                return (
                    <Modal className={wrapperClassName} content={content} />
                );
            }

        };
    };
});
