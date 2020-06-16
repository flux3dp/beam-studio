define([
    'jsx!widgets/Modal',
    'helpers/i18n',
], function (
    Modal,
    i18n
) {
    'use strict';
    const React = require('react');
    const classNames = require('classnames');

    const lang = i18n.lang.initialize;

    return function () {
        return class ConnectWiFi extends React.Component{
            constructor(props) {
                super(props);
                this.state = {
                    showCollapse1: false,
                    showCollapse2: false
                };
            }

            renderContent = () => {
                return (
                    <div className="connection-wired">
                        <div className="image-container">
                            <div className="hint-circle"/>
                            <img className="touch-panel-icon" src="img/init-panel/touch-panel-en.png" draggable="false"/>
                        </div>
                        <div className="text-container">
                            <div className="title">{lang.connect_wired.title}</div>
                            <div className="contents tutorial">
                                <div>{lang.connect_wired.tutorial1}</div>
                                <div>{lang.connect_wired.tutorial2}</div>
                            </div>
                            <div className={classNames('contents', 'what-if', {collapsed: !this.state.showCollapse1})}>
                                <div className="collapse-title" onClick={() => {this.setState({showCollapse1: !this.state.showCollapse1})}}>
                                    {lang.connect_wired.what_if_1}
                                    <div className="collapse-arrow"/>
                                </div>
                                <div className="collapse-contents">
                                    {lang.connect_wired.what_if_1_content}
                                </div>
                            </div>
                            <div className={classNames('contents', 'what-if', {collapsed: !this.state.showCollapse2})}>
                                <div className="collapse-title" onClick={() => {this.setState({showCollapse2: !this.state.showCollapse2})}}>
                                    {lang.connect_wired.what_if_2}
                                    <div className="collapse-arrow"/>
                                </div>
                                <div className="collapse-contents">
                                {lang.connect_wired.what_if_2_content}
                                </div>
                            </div>
                            {this.renderNextButton()}
                        </div>
                    </div>
                );
            }

            renderBackButton = () => {
                return (
                    <div className="btn-page back" onClick={() => {location.hash='#initialize/connect/select-connection-type'}} >
                        <div className="left-arrow"/>
                        {lang.back}
                    </div>
                );
            }

            renderNextButton = () => {
                return (
                    <div className="btn-page next" onClick={() => {location.hash='#initialize/connect/connect-machine-ip?wired=1'}} >
                        <div className="right-arrow"/>
                        {lang.next}
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
                        {this.renderBackButton()}
                        {innerContent}
                    </div>
                );

                return (
                    <Modal className={wrapperClassName} content={content} />
                );
            }

        };
    };
});
