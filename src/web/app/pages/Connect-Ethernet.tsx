import Modal from 'app/widgets/Modal';
import i18n from 'helpers/i18n';

const React = requireNode('react');

let lang = i18n.lang.initialize;
const updateLang = () => {
  lang = i18n.lang.initialize;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default () => class ConnectEthernet extends React.PureComponent {
  constructor(props) {
    super(props);
    updateLang();
  }

  renderContent = () => {
    const guideHref = process.platform === 'darwin' ? lang.connect_ethernet.tutorial2_a_href_mac : lang.connect_ethernet.tutorial2_a_href_win;
    const externalLink = (url: string) => {
      const electron = requireNode('electron');
      electron.remote.shell.openExternal(url);
    };
    return (
      <div className="connection-ethernet">
        <div className="image-container ether">
          <div className="circle c1" />
          <img className="ethernet-icon" src="img/init-panel/icon-dual-cable.svg" draggable="false" />
          <div className="circle c2" />
        </div>
        <div className="text-container">
          <div className="title">{lang.connect_ethernet.title}</div>
          <div className="contents tutorial">
            <div>{lang.connect_ethernet.tutorial1}</div>
            <div>
              {lang.connect_ethernet.tutorial2_1}
              <span className="link" onClick={() => externalLink(guideHref)}>
                {lang.connect_ethernet.tutorial2_a_text}
              </span>
              {lang.connect_ethernet.tutorial2_2}
            </div>
            <div>{lang.connect_ethernet.tutorial3}</div>
          </div>
        </div>
      </div>
    );
  };

  renderButtons = () => (
    <div className="btn-page-container">
      <div
        className="btn-page"
        onClick={() => { window.location.hash = '#initialize/connect/select-connection-type'; }}
      >
        {lang.back}
      </div>
      <div
        className="btn-page primary"
        onClick={() => { window.location.hash = '#initialize/connect/connect-machine-ip?wired=1'; }}
      >
        {lang.next}
      </div>
    </div>
  );

  render() {
    const wrapperClassName = { initialization: true };
    const innerContent = this.renderContent();
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
};
