import Modal from '../widgets/Modal';
import LocalStorage from '../../helpers/local-storage';
import * as i18n from '../../helpers/i18n';

const React = requireNode('react');
const lang = i18n.lang.initialize;

class SelectConnectionType extends React.Component{
    constructor(props) {
        super(props);
        this.state = {};
    }

    onClick = (method) => {
        switch (method) {
            case 'wi-fi':
                location.hash = '#initialize/connect/connect-wi-fi';
                break;
            case 'wired':
                location.hash = '#initialize/connect/connect-wired';
                break;
            case 'ether2ether':
                location.hash = '#initialize/connect/connect-ethernet';
                break;
        }
    }

    renderSelectConnectTypeStep = () => {
        return (
            <div className="select-connection-type">
                <h1 className="main-title">{lang.select_connection_type}</h1>
                <div className="btn-h-group">
                    <div className="btn-container">
                        <img className="connect-btn-icon" src="img/init-panel/icon-wifi.svg" draggable="false"/>
                        <button
                            className="btn btn-action"
                            onClick={() => this.onClick('wi-fi')}
                        >
                            {lang.connection_types.wifi}
                        </button>
                    </div>
                    <div className="btn-container">
                        <img className="connect-btn-icon" src="img/init-panel/icon-wired.svg" draggable="false"/>
                        <button
                            className="btn btn-action"
                            onClick={() => this.onClick('wired')}
                        >
                            {lang.connection_types.wired}
                        </button>
                    </div>
                    <div className="btn-container">
                        <img className="connect-btn-icon" src="img/init-panel/icon-e2e.svg" draggable="false"/>
                        <button
                            className="btn btn-action"
                            onClick={() => this.onClick('ether2ether')}
                        >
                            {lang.connection_types.ether_to_ether}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    renderButtons = () => {
        const isNewUser = !LocalStorage.get('printer-is-ready');
        return (
            <div className="btn-page-container">
                <div className="btn-page primary" onClick={() => {
                    if (isNewUser) {
                        LocalStorage.set('new-user', true);
                    }
                    LocalStorage.set('printer-is-ready', true);
                    location.hash = '#studio/beambox';
                    this.setState({isLoading: true});
                    location.reload();
                }} >
                    {isNewUser ? lang.skip : lang.cancel}
                </div>
            </div>
        );
    }

    render() {
        if (this.state.isLoading) {
            return (
                <div className='spinner-roller absolute-center'></div>
            );
        }
        const wrapperClassName = {
            'initialization': true
        };
        const innerContent = this.renderSelectConnectTypeStep();
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

export default () => SelectConnectionType
