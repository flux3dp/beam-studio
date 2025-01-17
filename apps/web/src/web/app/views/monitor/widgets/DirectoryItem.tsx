import classNames from 'classnames';
import React, { useContext } from 'react';

import { ItemType } from 'app/constants/monitor-constants';
import { MonitorContext } from 'app/contexts/MonitorContext';

import styles from './DirectoryItem.module.scss';

interface Props {
  name: string;
}

const DirectoryItem = ({ name }: Props): JSX.Element => {
  const { highlightedItem, onHighlightItem, onSelectFolder } = useContext(MonitorContext);
  const isSelected = highlightedItem.type === ItemType.FOLDER && highlightedItem.name === name;

  const handleClick = () => onHighlightItem({ name, type: ItemType.FOLDER });
  const handleDoubleClick = () => onSelectFolder(name);

  return (
    <div
      className={styles.container}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <div className={classNames(styles['img-container'], { [styles.selected]: isSelected })}>
        <img src="img/folder.svg" />
      </div>
      <div className={classNames(styles.name, { [styles.selected]: isSelected })}>
        {name}
      </div>
    </div>
  );
};

export default DirectoryItem;
