/* eslint-disable no-restricted-globals */
import Modal from 'app/widgets/Modal';
import i18n from 'helpers/i18n';

const React = requireNode('react');

let lang;

export default function () {
  return class ConnectEthernet extends React.PureComponent {
    constructor(props) {
      super(props);
      lang = i18n.lang.initialize;
    }

    renderContent = () => {
      const guideHref = process.platform === 'darwin' ? lang.connect_ethernet.tutorial2_a_href_mac : lang.connect_ethernet.tutorial2_a_href_win;
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
                <a target="_blank" href={guideHref} rel="noreferrer">{lang.connect_ethernet.tutorial2_a_text}</a>
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
        <div className="btn-page" onClick={() => { location.hash = '#initialize/connect/select-connection-type'; }}>
          {lang.back}
        </div>
        <div className="btn-page primary" onClick={() => { location.hash = '#initialize/connect/connect-machine-ip?wired=1'; }}>
          {lang.next}
        </div>
      </div>
    );

    render() {
      const wrapperClassName = {
        initialization: true,
      };
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
}
