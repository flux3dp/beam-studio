// This file is modified from packages/core/src/web/app/components/dialogs/myCloud/GridFile.tsx

import type { Dispatch, SetStateAction } from 'react';
import React, { useMemo } from 'react';

import classNames from 'classnames';
import dayjs from 'dayjs';

import type { WorkAreaModel } from '@core/app/constants/workarea-constants';
import { getWorkarea } from '@core/app/constants/workarea-constants';
import { setFileInAnotherTab } from '@core/helpers/fileImportHelper';
import type { IFile } from '@core/interfaces/IMyCloud';

import styles from './GridFile.module.scss';

interface Props {
  file: IFile;
  selectedId: null | string;
  setSelectedId: Dispatch<SetStateAction<null | string>>;
}

const getFileSize = (bytes: number) => {
  const k = 1000;
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let i = 0;

  for (; i < units.length - 1; i += 1) {
    if (size > k) {
      size /= k;
    } else {
      break;
    }
  }

  return size.toFixed(1) + units[i];
};

const GridFileLocal = ({ file, selectedId, setSelectedId }: Props): React.JSX.Element => {
  const workarea = getWorkarea(file.workarea as WorkAreaModel);
  const isSelected = useMemo(() => selectedId === file.uuid, [selectedId, file]);

  const onClick = () => {
    setSelectedId(file.uuid);
  };

  const onDoubleClick = () => {
    setFileInAnotherTab({ filePath: file.uuid, type: 'recent' });
  };

  return (
    <div className={classNames(styles.grid, { [styles.selected]: isSelected })}>
      <div className={styles['img-container']}>
        <div
          className={styles['guide-lines']}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          style={{ background: "url('core-img/flux-plus/guide-lines.png')" }}
        >
          <img src={file.thumbnail_url!} />
        </div>
      </div>
      <div className={styles.name}>
        <div className={styles.display} onClick={onClick} onDoubleClick={onDoubleClick}>
          {file.name}
        </div>
      </div>
      <div className={styles.info}>
        <div>
          {workarea?.label} &bull; {getFileSize(file.size)}
        </div>
        {dayjs(file.last_modified_at).format('MM/DD/YYYY hh:mm A')}
      </div>
    </div>
  );
};

export default GridFileLocal;
