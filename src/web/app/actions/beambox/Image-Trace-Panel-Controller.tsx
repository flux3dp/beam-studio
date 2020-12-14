import ImageTracePanel from '../../views/beambox/Image-Trace-Panel';

const React = requireNode('react');
const ReactDOM = requireNode('react-dom');
class ImageTracePanelController {
    reactRoot: string;
    constructor() {
        this.reactRoot = '';
    }
    init(reactRoot) {
        this.reactRoot = reactRoot;
    }

    render() {
        ReactDOM.render(
            <ImageTracePanel />
            ,document.getElementById(this.reactRoot)
        );
    }
}

const instance = new ImageTracePanelController();

export default instance;
