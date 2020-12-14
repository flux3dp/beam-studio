import ButtonGroup from './Button-Group';
import * as i18n from '../../helpers/i18n';
const React = requireNode('react');
var lang = i18n.lang.buttons;

class AlertDialog extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            imgIndex: 0
        }

    }

    _renderMessage = () => {
        if (this.props.displayImages) {
            return <img className={this.props.imgClass} src={this.props.images[this.state.imgIndex]}></img>
        } else {
            return typeof this.props.message === 'string' ?
                        <pre className="message" dangerouslySetInnerHTML={{__html: this.props.message}}></pre> :
                        <pre className="message">{this.props.message}</pre>
        }
    }

    _renderCheckbox = () => {
        const self = this;
        const _handleCheckboxClick = function(e) {
            if (e.target.checked) {
                self.props.buttons[0].onClick = () => {
                    self.props.checkedCallback();
                    self.props.onClose();
                }
            } else {
                self.props.buttons[0].onClick = () => {
                    self.props.onClose();
                }
            }
            self.setState(self.state);
        }

        if (this.props.checkbox) {
            return (
                <div className="modal-checkbox">
                    <input type="checkbox" onClick={_handleCheckboxClick}></input>{this.props.checkbox}
                </div>
            );
        } else {
            return null
        }
    }

    _renderButtons = () => {
        var self = this;
        if (this.props.displayImages) {
            if (this.state.imgIndex < this.props.images.length - 1) {
                return (<ButtonGroup buttons={[{
                    label: lang.next,
                    right: true,
                    onClick: () => {
                        self.setState({imgIndex: this.state.imgIndex + 1});
                    }
                }]}/>)
            } else {
                return <ButtonGroup buttons={[{
                    label: lang.next,
                    right: true,
                    onClick: () => {
                        self.setState({imgIndex: 0});
                        this.props.onCustom();
                        self.props.onClose();
                    }
                }]}/>
            }
        } else {
            return <ButtonGroup buttons={this.props.buttons}/>
        }
    }

    render() {
        var caption = (
                '' !== this.props.caption ?
                <h2 className="caption">{this.props.caption}</h2> :
                ''
            ),
            html = this._renderMessage(),
            checkbox = this._renderCheckbox(),
            buttons = this._renderButtons(),
            className = 'modal-alert';

            if (this.props.displayImages) {
                className += ' ' + this.props.imgClass;
            }

        return (
            <div className={className}>
                {caption}
                {html}
                {checkbox}
                {buttons}
            </div>
        );
    }
};
AlertDialog.defaultProps = {
    lang: {},
    caption: '',
    checkbox: '',
    message: '',
    buttons: [],
    images: [],
    imgClass: '',
    displayImages: false,
    onCustom: function() {},
    onClose: function() {}
};

export default AlertDialog;
