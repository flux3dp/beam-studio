import Modal from 'app/widgets/Modal';
import i18n from 'helpers/i18n';

const React = requireNode('react');
const classNames = requireNode('classnames');

let lang = i18n.lang.initialize;
const updateLang = (): void => {
  lang = i18n.lang.initialize;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default () => class ConnectWiFi extends React.PureComponent {
  constructor(props) {
    super(props);
    updateLang();
    this.state = {
      showCollapse1: false,
      showCollapse2: false,
    };
  }

  renderContent = () => {
    const { showCollapse1, showCollapse2 } = this.state;
    return (
      <div className="connection-wired">
        <div className="image-container">
          <div className="hint-circle" />
          <img className="touch-panel-icon" src="img/init-panel/touch-panel-en.jpg" draggable="false" />
        </div>
        <div className="text-container">
          <div className="title">{lang.connect_wired.title}</div>
          <div className="contents tutorial">
            <div>{lang.connect_wired.tutorial1}</div>
            <div>{lang.connect_wired.tutorial2}</div>
          </div>
          <div className={classNames('contents', 'what-if', { collapsed: !showCollapse1 })}>
            <div className="collapse-title" onClick={() => this.setState({ showCollapse1: !showCollapse1 })}>
              {lang.connect_wired.what_if_1}
              <div className="collapse-arrow" />
            </div>
            <div className="collapse-contents">
              {lang.connect_wired.what_if_1_content}
            </div>
          </div>
          <div className={classNames('contents', 'what-if', { collapsed: !showCollapse2 })}>
            <div className="collapse-title" onClick={() => this.setState({ showCollapse2: !showCollapse2 })}>
              {lang.connect_wired.what_if_2}
              <div className="collapse-arrow" />
            </div>
            <div className="collapse-contents">
              {lang.connect_wired.what_if_2_content}
            </div>
          </div>
        </div>
      </div>
    );
  };

  renderButtons = () => (
    <div className="btn-page-container">
      <div className="btn-page" onClick={() => { window.location.hash = '#initialize/connect/select-connection-type'; }}>
        {lang.back}
      </div>
      <div className="btn-page primary" onClick={() => { window.location.hash = '#initialize/connect/connect-machine-ip?wired=1'; }}>
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
