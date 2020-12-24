// import Draggable from 'react-draggable';

const React = requireNode('react');
const classNames = requireNode('classnames');
const Draggable = requireNode('react-draggable');

class DraggableWindow extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
    }

    componentWillUnmount() {
    }

    renderTrafficLight() {
        const { onClose } = this.props;
        return (
            <div className={classNames('traffic-lights')}>
                <div className={classNames('traffic-light', 'traffic-light-close')} onClick={onClose ? onClose : () => {}}/>
            </div>
        );
    }

    render() {
        const { title, children, defaultPosition, containerClass, handleClass } = this.props;
        return (
            <Draggable
                handle='.handle'
                defaultClassName={classNames('react-draggable', containerClass)}
                defaultPosition={defaultPosition}
                bounds='body'
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
};

export default DraggableWindow;