const React = requireNode('react');

export default class RadioGroup extends React.Component{

    render() {
        var options = this.props.options.map(function(opt, i) {
            var checked = false;

            if (opt.checked === true || opt.checked === 'checked') {
                checked = true;
            }

            return (
                <label>
                    <input type="radio" defaultChecked={checked} name={this.props.name} value={opt.value}/>
                    {opt.label}
                </label>
            );
        }, this);

        return  (
            <div
                id={this.props.id}
                className={this.props.className}
            >
                {options}
            </div>
        );
    }
};
