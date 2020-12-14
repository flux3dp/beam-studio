
const React = requireNode('react');
const classNames = requireNode('classnames');

// This Component is fully controled, i.e. every time it is changed, you have to rerender its parent to refresh it.
class SegmentedControl extends React.Component {
    constructor(props) {
        super(props);
        if (this.props.segments) {
            const { segments } = this.props;
            if (segments.length < 2) {
                console.warn('Segmented Control with segments less than 2');
            } else if (segments.length > 5) {
                console.warn('Segmented Control with segments more than 5, maybe too many.');
            }
        }
        if (this.props.selectedIndex !== null && (!this.props.selectedIndexes || this.props.selectedIndexes.length === 0)) {
            this.props.selectedIndexes.push(this.props.selectedIndex);
        }
        if (this.props.isExclusive && this.props.selectedIndexes.length > 1) {
            console.warn('Selected more than 1 items for exclusive control');
            this.props.selectedIndexes.splice(1, this.props.selectedIndexes.length - 1);
        } 
    }

    onClick = (index) => {
        if (this.isDisabled) {
            return;
        }
        const { segments, isExclusive, onChanged, selectedIndexes } = this.props;
        if (isExclusive) {
            if (selectedIndexes[0] !== index) {
                selectedIndexes[0] = index;
                const value = segments[index].value || index;
                onChanged(value);
                return value;
            }
        } else {
            const pos = selectedIndexes.findIndex((i) => i === index);
            if (pos < 0) {
                selectedIndexes.push(index);
                selectedIndexes.sort();
            } else {
                selectedIndexes.splice(pos, 1);
            }
            const values = selectedIndexes.map((i) => segments[i].value || i);
            onChanged(values);
            return values;
        }
    }

    renderItems() {
        const { segments, selectedIndexes } = this.props;
        const items = [];
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const isSelected = selectedIndexes.includes(i);
            items.push(
                <div key={i} className={classNames('seg-item', {'selected' :isSelected})} title={segment.title} onClick={() => this.onClick(i)}>
                    {segment.imgSrc ?
                        <img src={segment.imgSrc} className='seg-item-image' />
                        :
                        <div className='seg-item-text'>
                            {segment.text}
                        </div>
                    }
                </div>
            );
        }
        return items;
    }

    render() {
        const { isDisabled } = this.props;
        return (
            <div className={classNames('segmented-control', this.props.className, {disabled: isDisabled})}>
                {this.renderItems()}
            </div>
        );
    }
};

SegmentedControl.defaultProps = {
    isDisabled: false,
    isExclusive: true,
    className: '',
    segments: [
        {
            imgSrc: null,
            text: '1',
            title: 'Placeholder 1',
            value: 1,
        },
        {
            imgSrc: null,
            text: '2',
            title: 'Placeholder 2',
            value: 2,
        }
    ],
    selectedIndex: null,
    selectedIndexes: [],
    onChanged: (selectedIndexes) => {
        console.log(selectedIndexes)
    }
};

export default SegmentedControl;
