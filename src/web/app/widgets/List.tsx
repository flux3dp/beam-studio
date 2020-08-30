    const React = requireNode('react');;

    export default class List extends React.Component{
        render() {
            var list_items = this.props.items.map(function(opt, i){
                var metadata = JSON.stringify(opt.data),
                    labelItem = opt.label;
                if (labelItem.item) labelItem = labelItem.item;
                return <li data-meta={metadata} data-value={opt.value} key={i}>{labelItem}</li>;
            }, this);

            return  (
                <ul
                    name={this.props.name}
                    id={this.props.id}
                    className={this.props.className}
                    data-empty-message={this.props.emptyMessage}
                    onClick={this.props.onClick}
                    onDoubleClick={this.props.ondblclick}>
                    {list_items}
                </ul>
            );
        }
    };

    List.defaultProps = {
        name: '',
        id: '',
        emptyMessage: '',
        className: '',
        items: [],
        onClick: function() {},
        ondblclick: function() {}
    };
