import { CloseOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import classNames from 'classnames';

import ElementPreview from '@core/app/components/common/ElementPreview';
import ObjectPanelIcons from '@core/app/icons/object-panel/ObjectPanelIcons';

import styles from './ContentGrid.module.scss';

interface Props {
  image: SVGImageElement;
  isDefault: boolean;
  isImage: boolean;
  isSelected: boolean;
  onRemove?: () => void;
  onSelected: () => void;
}

const ContentGrid = ({ image, isDefault, isImage, isSelected, onRemove, onSelected }: Props) => {
  const renderPreview = () => {
    return (
      <ElementPreview element={image} override={isImage ? { href: image.getAttribute('xlink:href')! } : undefined} />
    );
  };

  return (
    <div className={classNames(styles.container, { [styles.selected]: isSelected })} onClick={onSelected}>
      {renderPreview()}
      {isDefault ? (
        <ObjectPanelIcons.Star className={classNames(styles.icon, styles.star)} />
      ) : (
        isSelected &&
        onRemove && <CloseOutlined className={classNames(styles.icon, styles.remove)} onClick={onRemove} />
      )}
    </div>
  );
};

export default ContentGrid;

interface SortableContentGridProps extends Props {
  id: string;
  index: number;
}

export const SortableContentGrid = ({ id, index, ...gridProps }: SortableContentGridProps) => {
  const { attributes, isDragging, isSorting, listeners, setNodeRef, transform, transition } = useSortable({
    data: { index },
    id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      className={classNames(styles.sortable, { [styles.dragging]: isDragging, [styles.sorting]: isSorting })}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <ContentGrid {...gridProps} />
    </div>
  );
};
