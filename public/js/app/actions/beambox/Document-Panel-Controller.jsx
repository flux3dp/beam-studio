define([
    'jsx!views/beambox/Document-Panels/Document-Panel',
    'app/actions/beambox/beambox-preference',
], function(
    DocumentPanel,
    BeamboxPreference
){
    const React = require('react');
    const ReactDOM = require('react-dom');
    class DocumentPanelController {
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
                <DocumentPanel
                    unmount={this.unmount}
                />, document.getElementById(this.reactRoot)
            );
        }
    }

    const instance = new DocumentPanelController();

    return instance;
});
