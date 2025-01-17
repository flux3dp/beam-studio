import React from 'react';

import i18n from 'helpers/i18n';
import { IButton } from 'interfaces/IButton';
import ButtonGroup from './ButtonGroup';

let lang = i18n.lang.buttons;

interface Props {
  caption: string,
  checkbox: string,
  message: string | JSX.Element,
  buttons: IButton[],
  displayImages: boolean
  images: string[],
  imgClass: string,
  onCustom: (...args: any[]) => void,
  onClose: (...args: any[]) => void,
  checkedCallback: (...args: any[]) => void,
}

interface States {
  imgIndex: number,
}

/**
  * @deprecated The method should not be used
*/
class AlertDialog extends React.Component<Props, States> {
  static defaultProps: Props = {
    caption: '',
    checkbox: '',
    message: '',
    buttons: [],
    images: [],
    imgClass: '',
    displayImages: false,
    onCustom: () => {},
    onClose: () => {},
    checkedCallback: () => {},
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      imgIndex: 0,
    };
  }

  renderMessage = (): JSX.Element => {
    const {
      displayImages, imgClass, images, message,
    } = this.props;
    if (displayImages) {
      return <img className={imgClass} src={images[this.state.imgIndex]} />;
    }
    return typeof message === 'string'
      ? <pre className="message" dangerouslySetInnerHTML={{ __html: message }} />
      : <pre className="message">{message}</pre>;
  };

  _renderCheckbox = () => {
    const self = this;
    const _handleCheckboxClick = function (e) {
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
            self.setState({ imgIndex: this.state.imgIndex + 1 });
          }
        }]} />)
      } else {
        return <ButtonGroup buttons={[{
          label: lang.next,
          right: true,
          onClick: () => {
            self.setState({ imgIndex: 0 });
            this.props.onCustom();
            self.props.onClose();
          }
        }]} />
      }
    } else {
      return <ButtonGroup buttons={this.props.buttons} />
    }
  }

  render() {
    var caption = (
      '' !== this.props.caption ?
        <h2 className="caption">{this.props.caption}</h2> :
        ''
    ),
      html = this.renderMessage(),
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

export default AlertDialog;
