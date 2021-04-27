const React = requireNode('react');

interface Props {
  name: string;
  id: string;
  emptyMessage: string;
  className: string;
  items: any[];
  onClick: () => void;
  ondblclick: () => void;
}

export default function List({
  name = '',
  id = '',
  emptyMessage = '',
  className = '',
  items = [],
  onClick = () => { },
  ondblclick = () => { },
}: Props) {
  const listItems = items.map((opt: any, i) => {
    const metadata = JSON.stringify(opt.data);
    let labelItem = opt.label;
    if (labelItem.item) labelItem = labelItem.item;
    // eslint-disable-next-line react/no-array-index-key
    return (<li data-meta={metadata} data-value={opt.value} key={i}>{labelItem}</li>);
  }, this);

  return (
    <ul
      name={name}
      id={id}
      className={className}
      data-empty-message={emptyMessage}
      onClick={onClick}
      onDoubleClick={ondblclick}
    >
      {listItems}
    </ul>
  );
}
