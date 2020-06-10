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
        return class ConnectEthernet extends React.Component{
            constructor(props) {
                super(props);
                this.state = {
                    showCollapse: false,
                };
            }

            renderContent = () => {
                const guideHref = process.platform === 'darwin' ? lang.connect_ethernet.tutorial2_a_href_mac : lang.connect_ethernet.tutorial2_a_href_win
                return (
                    <div className="connection-ethernet">
                        <div className="image-container">
                            <img className="arrow-icon top" src="img/init-panel/icon-arrow.svg" draggable="false"/>
                            <img className="ethernet-icon" src="img/init-panel/ethernet.svg" draggable="false"/>
                            <img className="arrow-icon bot" src="img/init-panel/icon-arrow.svg" draggable="false"/>
                        </div>
                        <div className="text-container">
                            <div className="title">{lang.connect_ethernet.title}</div>
                            <div className="contents tutorial">
                                <div>{lang.connect_ethernet.tutorial1}</div>
                                <div>
                                    {lang.connect_ethernet.tutorial2_1}
                                    <a target="_blank" href={guideHref}>{lang.connect_ethernet.tutorial2_a_text}</a>
                                    {lang.connect_ethernet.tutorial2_2}
                                </div>
                                <div>{lang.connect_ethernet.tutorial3}</div>
                            </div>
                            <div className={classNames('contents', 'what-if', {collapsed: !this.state.showCollapse})}>
                                <div className="collapse-title" onClick={() => {this.setState({showCollapse: !this.state.showCollapse})}}>
                                    {lang.connect_ethernet.what_if}
                                    <div className="collapse-arrow"/>
                                </div>
                                <div className="collapse-contents">
                                    {lang.connect_ethernet.what_if_content}
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
                    <div className="btn-page next" onClick={() => {location.hash='#initialize/connect/connect-machine-ip'}} >
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
