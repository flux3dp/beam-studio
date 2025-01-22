import React from 'react';

import i18n from '@core/helpers/i18n';
import type { IButton } from '@core/interfaces/IButton';

import ButtonGroup from './ButtonGroup';

let lang = i18n.lang.buttons;

interface Props {
  buttons: IButton[];
  caption: string;
  checkbox: string;
  checkedCallback: (...args: any[]) => void;
  displayImages: boolean;
  images: string[];
  imgClass: string;
  message: React.JSX.Element | string;
  onClose: (...args: any[]) => void;
  onCustom: (...args: any[]) => void;
}

interface States {
  imgIndex: number;
}

/**
 * @deprecated The method should not be used
 */
class AlertDialog extends React.Component<Props, States> {
  static defaultProps: Props = {
    buttons: [],
    caption: '',
    checkbox: '',
    checkedCallback: () => {},
    displayImages: false,
    images: [],
    imgClass: '',
    message: '',
    onClose: () => {},
    onCustom: () => {},
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      imgIndex: 0,
    };
  }

  renderMessage = (): React.JSX.Element => {
    const { displayImages, images, imgClass, message } = this.props;

    if (displayImages) {
      return <img className={imgClass} src={images[this.state.imgIndex]} />;
    }

    return typeof message === 'string' ? (
      <pre className="message" dangerouslySetInnerHTML={{ __html: message }} />
    ) : (
      <pre className="message">{message}</pre>
    );
  };

  _renderCheckbox = () => {
    const self = this;
    const _handleCheckboxClick = function (e) {
      if (e.target.checked) {
        self.props.buttons[0].onClick = () => {
          self.props.checkedCallback();
          self.props.onClose();
        };
      } else {
        self.props.buttons[0].onClick = () => {
          self.props.onClose();
        };
      }

      self.setState(self.state);
    };

    if (this.props.checkbox) {
      return (
        <div className="modal-checkbox">
          <input onClick={_handleCheckboxClick} type="checkbox"></input>
          {this.props.checkbox}
        </div>
      );
    } else {
      return null;
    }
  };

  _renderButtons = () => {
    var self = this;

    if (this.props.displayImages) {
      if (this.state.imgIndex < this.props.images.length - 1) {
        return (
          <ButtonGroup
            buttons={[
              {
                label: lang.next,
                onClick: () => {
                  self.setState({ imgIndex: this.state.imgIndex + 1 });
                },
                right: true,
              },
            ]}
          />
        );
      } else {
        return (
          <ButtonGroup
            buttons={[
              {
                label: lang.next,
                onClick: () => {
                  self.setState({ imgIndex: 0 });
                  this.props.onCustom();
                  self.props.onClose();
                },
                right: true,
              },
            ]}
          />
        );
      }
    } else {
      return <ButtonGroup buttons={this.props.buttons} />;
    }
  };

  render() {
    var caption = '' !== this.props.caption ? <h2 className="caption">{this.props.caption}</h2> : '',
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
}

export default AlertDialog;
