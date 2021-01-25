import Modal from '../widgets/Modal';
import i18n from '../../helpers/i18n';

const React = requireNode('react');
const classNames = requireNode('classnames');

let lang;

class ConnectWiFi extends React.Component{
    constructor(props) {
        super(props);
        lang = i18n.lang.initialize;
        this.state = {
            showCollapse1: false,
            showCollapse2: false
        };
    }

    renderContent = () => {
        return (
            <div className="connection-wifi">
                <div className="image-container">
                    <div className="hint-circle"/>
                    <img className="touch-panel-icon" src="img/init-panel/touch-panel-en.png" draggable="false"/>
                </div>
                <div className="text-container">
                    <div className="title">{lang.connect_wifi.title}</div>
                    <div className="contents tutorial">
                        <div>{lang.connect_wifi.tutorial1}</div>
                        <div>{lang.connect_wifi.tutorial2}</div>
                    </div>
                    <div className={classNames('contents', 'what-if', {collapsed: !this.state.showCollapse1})}>
                        <div className="collapse-title" onClick={() => {this.setState({showCollapse1: !this.state.showCollapse1})}}>
                            {lang.connect_wifi.what_if_1}
                            <div className="collapse-arrow"/>
                        </div>
                        <div className="collapse-contents">
                            {lang.connect_wifi.what_if_1_content}
                        </div>
                    </div>
                    <div className={classNames('contents', 'what-if', {collapsed: !this.state.showCollapse2})}>
                        <div className="collapse-title" onClick={() => {this.setState({showCollapse2: !this.state.showCollapse2})}}>
                            {lang.connect_wifi.what_if_2}
                            <div className="collapse-arrow"/>
                        </div>
                        <div className="collapse-contents">
                        {lang.connect_wifi.what_if_2_content}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    renderButtons = () => {
        return (
            <div className="btn-page-container">
                <div className="btn-page" onClick={() => {location.hash='#initialize/connect/select-connection-type'}} >
                    {lang.back}
                </div>
                <div className="btn-page primary" onClick={() => {location.hash='#initialize/connect/connect-machine-ip?wired=0'}} >
                    {lang.next}
                </div>
            </div>
        );
    }

    render() {
        const wrapperClassName = {
            'initialization': true
        };
        const innerContent = this.renderContent();
        const content = (
            <div className="connect-machine">
                <div className="top-bar"/>
                {this.renderButtons()}
                {innerContent}
            </div>
        );

        return (
            <Modal className={wrapperClassName} content={content} />
        );
    }
};

export default () => ConnectWiFi
