import Modal from 'app/widgets/Modal';
import BeamboxPreference from 'app/actions/beambox/beambox-preference';
import * as i18n from 'helpers/i18n';
import { WorkareaMap, WorkAreaModel } from 'app/actions/beambox/constant';

const React = requireNode('react');
const { lang } = i18n;

class SelectMachineType extends React.PureComponent {
  onSelectMachine = (model) => {
    BeamboxPreference.write('model', model);
    BeamboxPreference.write('workarea', model);
    window.location.hash = '#initialize/connect/select-connection-type';
  };

  skipConnectMachine = () => {
    window.location.hash = '#initialize/connect/skip-connect-machine';
  };

  renderSelectMachineButton = (model: WorkAreaModel) => (
    <button
      type="button"
      className="btn btn-action"
      onClick={this.onSelectMachine.bind(this, model)}
    >
      {WorkareaMap.get(model).label}
    </button>
  );

  renderSelectMachineStep = () => (
    <div className="select-machine-type">
      <h1 className="main-title">{lang.initialize.select_machine_type}</h1>
      <div className="btn-h-group">
        {this.renderSelectMachineButton('fbm1')}
        {this.renderSelectMachineButton('fbb1b')}
        {this.renderSelectMachineButton('fbb1p')}
      </div>
      <div className="btn btn-link" onClick={() => this.skipConnectMachine()}>
        {lang.initialize.no_machine}
      </div>
    </div>
  );

  render() {
    const wrapperClassName = {
      initialization: true,
    };
    const content = (
      <div className="connect-machine">
        <div className="top-bar" />
        {this.renderSelectMachineStep()}
      </div>
    );
    return (
      <Modal className={wrapperClassName} content={content} />
    );
  }
}

export default () => SelectMachineType;
