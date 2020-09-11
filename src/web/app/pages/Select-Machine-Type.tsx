import Modal from '../widgets/Modal';
import BeamboxPreference from '../actions/beambox/beambox-preference';
import Constant from '../actions/beambox/constant';
import * as i18n from '../../helpers/i18n';
const React = requireNode('react');

const lang = i18n.lang;

class SelectMachineType extends React.Component{
    onSelectMachine = (model) => {
        BeamboxPreference.write('model', model);
        BeamboxPreference.write('workarea', model);
        location.hash = '#initialize/connect/select-connection-type';
    }

    skipConnectMachine = () => {
        location.hash = '#initialize/connect/skip-connect-machine';
    }

    renderSelectMachineStep = () => {
        return (
            <div className="select-machine-type">
                <h1 className="main-title">{lang.initialize.select_machine_type}</h1>
                <div className="btn-h-group">
                    <button
                        className="btn btn-action"
                        onClick={() => this.onSelectMachine('fbm1')}
                    >
                        {'beamo'}
                    </button>
                    <button
                        className="btn btn-action"
                        onClick={() => this.onSelectMachine('fbb1b')}
                    >
                        {'Beambox'}
                    </button>
                    <button
                        className="btn btn-action"
                        onClick={() => this.onSelectMachine('fbb1p')}
                    >
                        {'Beambox Pro'}
                    </button>
                </div>
                <div className="btn btn-link" onClick={() => this.skipConnectMachine()}>
                    {lang.initialize.no_machine}
                </div>
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

export default () => SelectMachineType
