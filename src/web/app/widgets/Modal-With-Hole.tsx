import Modal from './Modal';

const React = requireNode('react');
const classNames = requireNode('classnames');

class ModalWithHole extends React.Component{
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        window.addEventListener('resize', () => this.handleResizeWindow());
    }

    componentWillUnmount() {
        window.removeEventListener('resize', () => this.handleResizeWindow());
    }

    handleResizeWindow() {
        this.setState({});
    }

    render() {
        const { className, holePosition, holeSize } = this.props;
        if (!holePosition) {
            return (
                <Modal className={{'with-hole': true}}>
                    {this.props.children || this.props.content}
                </Modal>
            );
        }
        const backgroundClass = classNames('modal-window', 'with-hole', className);
        let {width, height} = holeSize;
        if (!height) {
            height = window.innerHeight - (holePosition.top || 0 + holePosition.bottom || 0);
        }
        if (!width) {
            width = window.innerWidth - (holePosition.left || 0 + holePosition.right || 0);
        }
        const bottom = (holePosition.top !== undefined) ? `calc(100% - ${holePosition.top}px)` : (holePosition.bottom + height);
        const top = (holePosition.bottom !== undefined) ? `calc(100% - ${holePosition.bottom}px)` : (holePosition.top + height);
        const right = (holePosition.left !== undefined) ? `calc(100% - ${holePosition.left}px)` : (holePosition.right + width);
        const left = (holePosition.right !== undefined) ? `calc(100% - ${holePosition.right}px)` : (holePosition.left + width);
        return (
            <div className={backgroundClass}>
                <div className="modal-background" style={{top}}/>
                <div className="modal-background" style={{bottom}}/>
                <div className="modal-background" style={{left}}/>
                <div className="modal-background" style={{right}}/>
                <div className="modal-body">{this.props.children || this.props.content}</div>
            </div>
        );
    }
};

export default ModalWithHole;
