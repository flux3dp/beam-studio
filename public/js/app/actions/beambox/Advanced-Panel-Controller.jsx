define([
    'jsx!views/beambox/Advanced-Panel',
    'app/actions/beambox/beambox-preference',
], function(
    AdvancedPanel,
    BeamboxPreference
){
    const React = require('react');
    const ReactDOM = require('react-dom');
    class AdvancedPanelController {
        constructor() {
            this.reactRoot = '';
            this.isVisible = false;
            this.src = null;
            this.unmount = this.unmount.bind(this);
        }

        init(reactRoot) {
            this.reactRoot = reactRoot;
        }

        render() {
            this._render();
        }

        setVisibility(isVisible) {
            this.isVisible = isVisible;
        }

        unmount() {
            ReactDOM.unmountComponentAtNode(document.getElementById(this.reactRoot));
        }

        _render() {
            ReactDOM.render(
                <AdvancedPanel
                    unmount={this.unmount}
                />, document.getElementById(this.reactRoot)
            );
        }
    }

    const instance = new AdvancedPanelController();

    return instance;
});
