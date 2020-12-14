import Modal from './Modal';
import AlertDialog from './AlertDialog';
import ProgressConstants from '../constants/progress-constants';

const React = requireNode('react');
const PropTypes = requireNode('prop-types');

var acceptableTypes = [
    ProgressConstants.WAITING,
    ProgressConstants.STEPPING,
    ProgressConstants.NONSTOP,
    ProgressConstants.NONSTOP_WITH_MESSAGE
];

class Progress extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            percentage: this.props.percentage
        };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        this.setState({
            percentage: nextProps.percentage
        });
    }

    _getButton() {
        var buttons = [];

        switch (this.props.type) {
        case ProgressConstants.WAITING:
        case ProgressConstants.STEPPING:
            buttons.push({
                label: this.props.lang.alert.stop,
                dataAttrs: {
                    'ga-event': 'stop'
                },
                onClick: this.props.onStop
            });
            break;
        case ProgressConstants.NONSTOP:
            // No button
            break;
        }

        if (false === this.props.hasStop) {
            // clear button
            buttons = [];
        }

        return buttons;
    }

    _renderMessage() {
        var message,
            progressIcon = this._renderIcon();

        switch (this.props.type) {
        case ProgressConstants.WAITING:
        case ProgressConstants.STEPPING:
            message = (
                <div>
                    <p>{this.props.message}</p>
                    {progressIcon}
                </div>
            );
            break;
        case ProgressConstants.NONSTOP:
        case ProgressConstants.NONSTOP_WITH_MESSAGE:
            message = progressIcon;
            break;
        }

        return message;
    }

    _renderIcon() {
        var icon,
            progressStyle = {
                width: (this.state.percentage || 0) + '%'
            };

        switch (this.props.type) {
        case ProgressConstants.WAITING:
        case ProgressConstants.NONSTOP:
        case ProgressConstants.NONSTOP_WITH_MESSAGE:
            icon = (
                <div className="spinner-roller spinner-roller-reverse"/>
            );
            break;
        case ProgressConstants.STEPPING:
            icon = (
                <div className="progress-bar" data-percentage={this.props.percentage}>
                    <div className="current-progress" style={progressStyle}/>
                </div>
            );
            break;
        }

        return icon;

    }

    render() {
        if (false === this.props.isOpen) {
            return <div/>
        }

        var buttons = this._getButton(),
            progressIcon = this._renderIcon(),
            message = this._renderMessage(),
            content = (
                <AlertDialog
                    lang={this.props.lang}
                    caption={this.props.caption}
                    message={message}
                    buttons={buttons}
                />
            ),
            className = {
                'shadow-modal': true,
                'waiting': ProgressConstants.WAITING === this.props.type,
                'modal-progress': true,
                'modal-progress-nonstop': ProgressConstants.NONSTOP === this.props.type,
                'modal-progress-nonstop-with-message': ProgressConstants.NONSTOP_WITH_MESSAGE === this.props.type
            };

        return (
            <Modal className={className} content={content} disabledEscapeOnBackground={false}/>
        );
    }
}

Progress.propTypes = {
    type       : PropTypes.oneOf(acceptableTypes),
    isOpen     : PropTypes.bool,
    lang       : PropTypes.object,
    caption    : PropTypes.string,
    message    : PropTypes.string,
    percentage : PropTypes.number,
    hasStop    : PropTypes.bool,
    onStop     : PropTypes.func,
    onFinished : PropTypes.func
};

Progress.defaultProps = {
    lang       : {},
    isOpen     : true,
    caption    : '',
    message    : '',
    type       : ProgressConstants.WAITING,
    percentage : 0,
    hasStop    : true,
    onStop     : function() {},
    onFinished : function() {}
};

export default Progress;
