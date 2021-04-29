import dialog from 'app/actions/dialog-caller';
import Modal from 'app/widgets/Modal';
import storage from 'helpers/storage-helper';
import i18n from 'helpers/i18n';
import windowLocationReload from 'app/actions/windowLocation';

const React = requireNode('react');

let lang;

class SelectConnectionType extends React.PureComponent {
  constructor(props) {
    super(props);
    lang = i18n.lang.initialize;
  }

  selectConnectionType = (type: 'wifi' | 'wired' | 'ether2ether') => {
    // eslint-disable-next-line default-case
    switch (type) {
      case 'wifi':
        window.location.hash = '#initialize/connect/connect-wi-fi';
        break;
      case 'wired':
        window.location.hash = '#initialize/connect/connect-wired';
        break;
      case 'ether2ether':
        window.location.hash = '#initialize/connect/connect-ethernet';
        break;
    }
  };

  renderConnectionTypeContainer = (type: 'wifi' | 'wired' | 'ether2ether') => (
    <div className="btn-container">
      <img className="connect-btn-icon" src={`img/init-panel/icon-${type}.svg`} draggable="false" />
      {this.renderConnectionTypeButton(type)}
    </div>
  );

  renderConnectionTypeButton = (type: 'wifi' | 'wired' | 'ether2ether') => (
    <button
      type="button"
      className="btn btn-action"
      onClick={this.selectConnectionType.bind(this, type)}
    >
      {lang.connection_types[type]}
    </button>
  );

  renderSelectConnectTypeStep = () => (
    <div className="select-connection-type">
      <h1 className="main-title">{lang.select_connection_type}</h1>
      <div className="btn-h-group">
        {this.renderConnectionTypeContainer('wifi')}
        {this.renderConnectionTypeContainer('wired')}
        {this.renderConnectionTypeContainer('ether2ether')}
      </div>
    </div>
  );

  clickButton = (isNewUser: boolean) => {
    if (isNewUser) {
      storage.set('new-user', true);
    }
    storage.set('printer-is-ready', true);
    dialog.showLoadingWindow();
    window.location.hash = '#studio/beambox';
    windowLocationReload();
  };

  renderButtons = () => {
    const isNewUser = !storage.get('printer-is-ready');
    return (
      <div className="btn-page-container">
        <div className="btn-page primary" onClick={this.clickButton.bind(this, isNewUser)}>
          {isNewUser ? lang.skip : lang.cancel}
        </div>
      </div>
    );
  };

  render() {
    const wrapperClassName = {
      initialization: true,
    };
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

export default () => SelectConnectionType;
