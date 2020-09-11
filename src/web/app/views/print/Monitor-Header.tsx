import GlobalConstants from '../../../app/constants/global-constants';
import DeviceConstants from '../../../app/constants/device-constants';

const React = requireNode('react');
const PropTypes = requireNode('prop-types');

class MonitorHeader extends React.Component{
    constructor(props) {
        super(props);
        let { store } = this.props.context;

        this.unsubscribe = store.subscribe(() => {
            this.forceUpdate();
        });
    }

    UNSAFE_componentWillUpdate() {
        return false;
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    _renderNavigation = () => {
        let { Monitor, Device } = this.props.context.store.getState(),
            history = this.props.history,
            source = this.props.source;

        const back = () => (
            <div className="back" onClick={this.props.onBackClick}>
                <i className="fa fa-angle-left"></i>
            </div>
        );

        const folder = () => (
            <div className="back" onClick={this.props.onFolderClick}>
                <img src="img/folder.svg" />
            </div>
        );

        const none = () => (
            <div></div>
        );

        if(source === GlobalConstants.DEVICE_LIST) {
            let go = {};

            go[GlobalConstants.CAMERA] = () => {
                return back();
            };

            go[GlobalConstants.CAMERA_RELOCATE] = () => {
                return back();
            };

            go[GlobalConstants.FILE] = () => {
                if(Device.status.st_id === DeviceConstants.status.IDLE) {
                    return history.length >= 1 ? back() : none();
                }
                return back();
            };

            if(typeof go[Monitor.mode] === 'function') {
                return go[Monitor.mode]();
            }
            else {
                return history.length > 1 ? back() : folder();
            }
        }
        else {
            return (Monitor.mode === GlobalConstants.PREVIEW && history.length === 0) ?
                folder() : back();
        };
    }

    render() {
        let nav = this._renderNavigation();

        return (
            <div className="header">
                <div className="title">
                    <span>{this.props.name}</span>
                    <div className="close" onClick={this.props.onCloseClick}>
                        <div className="x"></div>
                    </div>
                    {nav}
                </div>
            </div>
        );
    }
};
MonitorHeader.propTypes = {
    name:           PropTypes.string,
    source:         PropTypes.string,
    history:        PropTypes.array,
    onBackClick:    PropTypes.func,
    onFolderClick:  PropTypes.func,
    onCloseClick:   PropTypes.func
}

export default MonitorHeader;
