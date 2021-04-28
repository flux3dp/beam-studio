const React = requireNode('react');
const classNames = requireNode('classnames');
const Draggable = requireNode('react-draggable');

interface Props {
  title: string;
  defaultPosition: { x: number, y: number };
  containerClass: string;
  handleClass: string;
  onClose?: () => void;
}
class DraggableWindow extends React.PureComponent<Props> {
  renderTrafficLight() {
    const { onClose } = this.props;
    return (
      <div className={classNames('traffic-lights')}>
        <div className={classNames('traffic-light', 'traffic-light-close')} onClick={onClose || (() => { })} />
      </div>
    );
  }

  render() {
    const {
      title,
      children,
      defaultPosition,
      containerClass,
      handleClass,
    } = this.props;
    return (
      <Draggable
        handle=".handle"
        defaultClassName={classNames('react-draggable', containerClass)}
        defaultPosition={defaultPosition}
        bounds="body"
      >
        <div>
          <div className={classNames('handle', handleClass)}>
            {title}
          </div>
          {this.renderTrafficLight()}
          {children}
        </div>
      </Draggable>
    );
  }
}

export default DraggableWindow;
