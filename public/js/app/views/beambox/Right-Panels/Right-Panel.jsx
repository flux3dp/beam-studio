define([
    'jsx!views/beambox/Right-Panels/Layer-Panel',
    'jsx!views/beambox/Right-Panels/Laser-Panel',
    'helpers/i18n'
], function(
    LayerPanel,
    LaserPanel,
    i18n
) {
    const React = require('react');
    const LANG = i18n.lang.beambox.right_panel;

    class RightPanel extends React.Component {
        constructor() {
            super();
            this.state = {
            };
        }

        render() {
            return (
                <div id="sidepanels">
                    <LayerPanel />
                    <div id="layer-laser-panel-placeholder"/>
                </div>
            );
        }
    } 

    return RightPanel;
});
