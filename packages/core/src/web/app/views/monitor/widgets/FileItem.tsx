import classNames from 'classnames';
import React, { SyntheticEvent, useContext, useEffect, useState } from 'react';

import deviceMaster from 'helpers/device-master';
import { ItemType } from 'app/constants/monitor-constants';
import { MonitorContext } from 'app/contexts/MonitorContext';

import styles from './FileItem.module.scss';

const maxFileNameLength = 12;
const DEFAULT_IMAGE = 'img/ph_s.png';

interface Props {
  path: string;
  fileName: string;
}

interface State {
  imgSrc?: string;
  fileInfo?: [string, { [key: string]: string | number }, Blob, { [key: string]: string | number }];
}

const onImageError = (evt: SyntheticEvent<HTMLImageElement>) => {
  // eslint-disable-next-line no-param-reassign
  evt.currentTarget.src = 'img/ph_s.png';
};

const FileItem = ({ path, fileName }: Props): JSX.Element => {
  const [state, setState] = useState<State>({});

  useEffect(() => {
    const getStates = async () => {
      const res = await deviceMaster.fileInfo(path, fileName);
      let imgSrc: string;
      if (res && res[2] instanceof Blob) {
        imgSrc = URL.createObjectURL(res[2]);
      }
      if (state.imgSrc) URL.revokeObjectURL(state.imgSrc);
      setState({
        imgSrc,
        fileInfo: res as [
          string,
          { [key: string]: string | number },
          Blob,
          { [key: string]: string | number }
        ],
      });
    };
    getStates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, fileName]);

  const { highlightedItem, onHighlightItem, onSelectFile, onDeleteFile } =
    useContext(MonitorContext);
  const { imgSrc, fileInfo } = state;
  const isSelected = highlightedItem.name === fileName && highlightedItem.type === ItemType.FILE;
  return (
    <div
      title={fileName}
      className={classNames(styles.container)}
      data-test-key={fileName}
      data-filename={fileName}
      onClick={() => onHighlightItem({ name: fileName, type: ItemType.FILE })}
      onDoubleClick={() => onSelectFile(fileName, fileInfo)}
    >
      <div className={classNames(styles['img-container'], { [styles.selected]: isSelected })}>
        <img src={imgSrc || DEFAULT_IMAGE} onError={onImageError} />
        <i className={classNames('fa', 'fa-times-circle-o')} onClick={onDeleteFile} />
      </div>
      <div className={classNames(styles.name, { [styles.selected]: isSelected })}>
        {fileName.length > maxFileNameLength
          ? `${fileName.substring(0, maxFileNameLength)}...`
          : fileName}
      </div>
    </div>
  );
};

export default FileItem;
