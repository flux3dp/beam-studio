import Modal from '../widgets/Modal';
import LocalStorage from '../../helpers/local-storage';
import * as i18n from '../../helpers/i18n';
const React = requireNode('react');

const lang = i18n.lang;

export default function () {
    return class SkipConnectMachine extends React.Component{

        onStart = () => {
            if (!LocalStorage.get('printer-is-ready')) {
                LocalStorage.set('new-user', true);
            }
            LocalStorage.set('printer-is-ready', true);
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