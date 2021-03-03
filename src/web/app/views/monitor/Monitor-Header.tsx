const React = requireNode('react');

import { MonitorContext } from 'app/contexts/Monitor-Context';

export enum NavBtnType {
    NONE = 0,
    BACK = 1,
    FOLDER = 2,
}

class MonitorHeader extends React.PureComponent {
    constructor(props) {
        super(props);
    }

    renderNavigationBtn() {
        const { onNavigationBtnClick } = this.context;
        const { navBtnType } = this.props;
        if (navBtnType === NavBtnType.BACK) {
            return (
                <div className="back" onClick={onNavigationBtnClick}>
                    <i className="fa fa-angle-left"></i>
                </div>
            );
        } else if (navBtnType === NavBtnType.FOLDER) {
            return (
                <div className="back" onClick={onNavigationBtnClick}>
                    <img src="img/folder.svg" />
                </div>
            );
        }
        return <div/>
    }
    
    render() {
        const { onClose } = this.context;
        return (
            <div className="header">
                <div className="title">
                    <span>{this.props.name}</span>
                    <div className="close" onClick={onClose}>
                        <div className="x"></div>
                    </div>
                    {this.renderNavigationBtn()}
                </div>
            </div>
        );
    }
};

MonitorHeader.contextType = MonitorContext;

export default MonitorHeader;