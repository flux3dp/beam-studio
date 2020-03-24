define([
    'jsx!views/beambox/Photo-Edit-Panel'
], function(
    PhotoEditPanel
){
    const React = require('react');
    const ReactDOM = require('react-dom');
    class PhotoEditPanelController {
        constructor() {
            this.reactRoot = '';
            this.element = null;
            this.src = null;
            this.unmount = this.unmount.bind(this);
        }

        init(reactRoot) {
            this.reactRoot = reactRoot;
        }

        render() {
            if(this.src) {
                this._render();
            } else {
                this.unmount();
            }
        }

        setElememt(element) {
            this.element = element;
            this.src = element.getAttribute('origImage');
        }

        setMode(mode) {
            this.mode = mode;
        }

        unmount() {
            this.element = null;
            ReactDOM.unmountComponentAtNode(document.getElementById(this.reactRoot));
        }

        _render() {
            ReactDOM.render(
                <PhotoEditPanel
                    mode={this.mode}
                    element={this.element}
                    src={this.src}
                    unmount={this.unmount}
                />, document.getElementById(this.reactRoot)
            );
        }
    }

    const instance = new PhotoEditPanelController();

    return instance;
});
