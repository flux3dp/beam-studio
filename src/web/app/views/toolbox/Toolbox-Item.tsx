
    const React = requireNode('react');;
    class ToolboxItem extends React.Component {
        constructor() {
            super();
        }

        render() {
            return (
                <div onClick={this.props.onClick} className="toolbox-item" title={this.props.title}>
                    <img src={this.props.src} />
                </div>
            );
        }
    }
    export default ToolboxItem;