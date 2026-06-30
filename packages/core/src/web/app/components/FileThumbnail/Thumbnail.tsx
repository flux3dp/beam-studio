import React, { useEffect, useState } from 'react';

import { CloseOutlined, EyeInvisibleOutlined, EyeOutlined, FileUnknownOutlined, SyncOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';

import useForceUpdate from '@core/helpers/use-force-update';

import styles from './Thumbnail.module.scss';
import { onThumbnailDataChange, removeThumbnail, thumbnailsData, togglePreviewVisibility } from './utils';

interface Props {
  thumbnailKey: string;
  withActions?: boolean;
}

const Thumbnail = ({ thumbnailKey, withActions }: Props) => {
  const forceUpdate = useForceUpdate();
  const thumbnailData = thumbnailsData[thumbnailKey];
  const [error, setError] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setError(false);
      forceUpdate();
    };

    return onThumbnailDataChange(thumbnailKey, refresh);
  }, [thumbnailKey, forceUpdate]);

  const imgSrc = thumbnailData.src;

  return (
    <div className={classNames(styles.container, { [styles.interactive]: withActions })}>
      {!imgSrc || error ? (
        thumbnailData.isPreview ? (
          <SyncOutlined className={styles.icon} spin />
        ) : (
          <FileUnknownOutlined className={styles.icon} />
        )
      ) : (
        <img alt="thumbnail" className={styles.image} onError={() => setError(true)} src={imgSrc} />
      )}
      {withActions && !thumbnailData.isPreview && (
        <Button className={styles.button} icon={<CloseOutlined />} onClick={() => removeThumbnail(thumbnailKey)} />
      )}
      {withActions && thumbnailData.isPreview && (
        <Button
          className={styles.button}
          disabled={thumbnailData.isVisibleDisabled}
          icon={thumbnailData.isVisible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
          onClick={togglePreviewVisibility}
        />
      )}
    </div>
  );
};

export default Thumbnail;
