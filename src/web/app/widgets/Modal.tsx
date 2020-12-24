import $ from 'jquery'
import shortcuts from '../../helpers/shortcuts';
const React = requireNode('react');
const classNames = requireNode('classnames');
const PropTypes = requireNode('prop-types');


class View extends React.Component{
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        var self = this;

        self.onOpen();

        shortcuts.on(
            ['esc'],
            function(e) {
                if (false === self.props.disabledEscapeOnBackground) {
                    self.props.onClose(e);
                }
            }
        );
    }

    componentWillUnmount() {
        shortcuts.off(['esc']);
        if (window['svgEditor']) {
            shortcuts.on(['esc'], window['svgEditor'].clickSelect);
        }
    }

    onOpen = () => {
        if(this.props.onOpen) {
            this.props.onOpen(this);
        }
    }

    _onEscapeOnBackground = (e) => {
        var self = this;

        if (false === self.props.disabledEscapeOnBackground) {
            self.props.onClose(e);
        }
    }

    render() {
        var backgroundClass;

        this.props.className['modal-window'] = true;
        backgroundClass = classNames(this.props.className);

        return (
            <div className={backgroundClass}>
                <div className="modal-background" onClick={this._onEscapeOnBackground}/>
                <div className="modal-body">{this.props.children || this.props.content}</div>
            </div>
        );
    }
};

View.propTypes = {
    onOpen      : PropTypes.func,
    onClose     : PropTypes.func,
    content     : PropTypes.element,
    className   : PropTypes.object
};
View.defaultProps = {
    onOpen: function() {},
    onClose: function() {},
    content: <div/>,
    disabledEscapeOnBackground: false,
    className: {}
}

export default View;
