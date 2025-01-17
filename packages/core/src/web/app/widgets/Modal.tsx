import * as React from 'react';
import classNames from 'classnames';
import shortcuts from '../../helpers/shortcuts';

interface Props {
  children?: JSX.Element;
  onOpen?: (any?) => void;
  onClose?: (any?) => void;
  content?: JSX.Element;
  disabledEscapeOnBackground?: boolean;
  className?: any;
}
class View extends React.Component<Props> {
  componentDidMount() {
    const { disabledEscapeOnBackground = false, onClose = () => {} } = this.props;

    this.onOpen();
    shortcuts.on(['Escape'], (e) => {
      if (!disabledEscapeOnBackground) {
        onClose(e);
      }
    });
  }

  componentWillUnmount() {
    shortcuts.off(['Escape']);
    if (window.svgEditor) {
      shortcuts.on(['Escape'], window.svgEditor.clickSelect);
    }
  }

  onOpen = () => {
    const { onOpen = () => {} } = this.props;
    if (onOpen) {
      onOpen(this);
    }
  };

  onEscapeOnBackground = (e): void => {
    const { disabledEscapeOnBackground = false, onClose = () => {} } = this.props;
    if (!disabledEscapeOnBackground) {
      onClose(e);
    }
  };

  render() {
    const { className = {}, children, content = <div /> } = this.props;
    className['modal-window'] = true;

    return (
      <div className={classNames(className)}>
        <div className="modal-background" onClick={this.onEscapeOnBackground} />
        <div className="modal-body">{children || content}</div>
      </div>
    );
  }
}

export default View;
