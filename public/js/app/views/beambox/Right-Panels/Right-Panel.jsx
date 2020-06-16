define([
    'jsx!views/beambox/Right-Panels/contexts/RightPanelContext',
    'jsx!views/beambox/Right-Panels/contexts/ObjectPanelContext',
    'jsx!views/beambox/Right-Panels/contexts/LayerPanelContext',
    'jsx!views/beambox/Right-Panels/Object-Panel',
    'jsx!views/beambox/Right-Panels/Layer-Panel',
    'jsx!views/beambox/Right-Panels/Laser-Panel',
    'helpers/i18n'
], function(
    { RightPanelContext },
    { ObjectPanelContextProvider },
    { LayerPanelContextProvider },
    { ObjectPanel },
    { LayerPanel },
    LaserPanel,
    i18n
) {
    const React = require('react');
    const classNames = require('classnames');
    const LANG = i18n.lang.beambox.right_panel;

    let ret = {};

    class RightPanel extends React.Component {
        constructor() {
            super();
            this.state = {
                selectedTab: 'layers'
            };
        }

        componentDidMount() {
            ret.contextCaller = this.context;
        }

        componentDidUpdate() {
            const { selectedElement } = this.context;
            const { selectedTab } = this.state;
            if (!selectedElement && selectedTab !== 'layers') {
                this.setState({selectedTab: 'layers'});
            } else if (selectedElement && !this.lastElement) {
                //console.log(this.lastElement);
                this.setState({selectedTab: 'objects'});
            }
            this.lastElement = selectedElement;
        }

        renderTabs() {
            const { selectedElement } = this.context;
            const { selectedTab } = this.state;
            const isObjectDisabled = (!selectedElement || selectedElement.length < 1);
            return (
                <div className="right-panel-tabs">
                    <div
                        className={classNames('tab', 'layers', {selected: selectedTab === 'layers'})}
                        onClick={() => {this.setState({selectedTab: 'layers'})}}>
                        <img className="tab-icon" src="img/right-panel/icon-layers.svg"/>
                        <div className="tab-title">
                            {LANG.tabs.layers}
                        </div>
                    </div>
                    <div
                        className={classNames('tab', 'objects', {disabled: isObjectDisabled, selected: selectedTab === 'objects'})}
                        onClick={() => {if (!isObjectDisabled) this.setState({selectedTab: 'objects'})}}>
                        <img className="tab-icon" src="img/right-panel/icon-layers.svg"/>
                        <div className="tab-title">
                            {LANG.tabs.objects}   
                        </div>
                    </div>
                </div>
            );
        }

        renderLayerAndLaserPanel() {
            return (
                <LayerPanelContextProvider>
                    <LayerPanel />
                </LayerPanelContextProvider>
            );
        }

        renderObjectPanel() {
            const { selectedElement } = this.context;
            return (
                    <ObjectPanel
                        elem={selectedElement}
                    />
            );
        }

        render() {
            const { selectedElement } = this.context;
            const { selectedTab } = this.state;
            let content;
            if (!selectedElement || selectedElement.length < 1 || selectedTab === 'layers') {
                content = this.renderLayerAndLaserPanel();
            } else {
                content = this.renderObjectPanel();
            }
            return (
                <div id="right-panel">
                    <div id="sidepanels">
                        {this.renderTabs()}
                        <ObjectPanelContextProvider>
                            {content}
                        </ObjectPanelContextProvider>
                    </div>
                </div>
            );
        }
    }
    RightPanel.contextType = RightPanelContext;
    ret.RightPanel = RightPanel;

    return ret;
});
