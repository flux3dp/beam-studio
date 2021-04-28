import dialog from 'app/actions/dialog-caller';
import Modal from 'app/widgets/Modal';
import storage from 'helpers/storage-helper';
import i18n from 'helpers/i18n';

const React = requireNode('react');

let lang;

class SelectConnectionType extends React.Component {
  constructor(props) {
    super(props);
    lang = i18n.lang.initialize;
    this.state = {};
  }

  onClick = (method: string) => {
    switch (method) {
      case 'wi-fi':
        window.location.hash = '#initialize/connect/connect-wi-fi';
        break;
      case 'wired':
        window.location.hash = '#initialize/connect/connect-wired';
        break;
      case 'ether2ether':
        window.location.hash = '#initialize/connect/connect-ethernet';
        break;
      default:
        break;
    }
  };

  renderSelectConnectTypeStep = () => (
    <div className="select-connection-type">
      <h1 className="main-title">{lang.select_connection_type}</h1>
      <div className="btn-h-group">
        <div className="btn-container">
          <img className="connect-btn-icon" src="img/init-panel/icon-wifi.svg" draggable="false" />
          <button
            type="button"
            className="btn btn-action"
            onClick={() => this.onClick('wi-fi')}
          >
            {lang.connection_types.wifi}
          </button>
        </div>
        <div className="btn-container">
          <img className="connect-btn-icon" src="img/init-panel/icon-wired.svg" draggable="false" />
          <button
            type="button"
            className="btn btn-action"
            onClick={() => this.onClick('wired')}
          >
            {lang.connection_types.wired}
          </button>
        </div>
        <div className="btn-container">
          <img className="connect-btn-icon" src="img/init-panel/icon-e2e.svg" draggable="false" />
          <button
            type="button"
            className="btn btn-action"
            onClick={() => this.onClick('ether2ether')}
          >
            {lang.connection_types.ether_to_ether}
          </button>
        </div>
      </div>
    </div>
  );

  renderButtons = () => {
    const isNewUser = !storage.get('printer-is-ready');
    return (
      <div className="btn-page-container">
        <div
          className="btn-page primary"
          onClick={() => {
            if (isNewUser) {
              storage.set('new-user', true);
            }
            storage.set('printer-is-ready', true);
            dialog.showLoadingWindow();
            window.location.hash = '#studio/beambox';
            window.location.reload();
          }}
        >
          {isNewUser ? lang.skip : lang.cancel}
        </div>
      </div>
    );
  };

  render() {
    const wrapperClassName = { initialization: true };
    const innerContent = this.renderSelectConnectTypeStep();
    const content = (
      <div className="connect-machine">
        <div className="top-bar" />
        {this.renderButtons()}
        {innerContent}
      </div>
    );

    return (
      <Modal className={wrapperClassName} content={content} />
    );
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default () => SelectConnectionType;
