import React, { useEffect } from 'react';

import { Carousel } from 'antd';

import Thumbnail from '@core/app/components/FileThumbnail/Thumbnail';
import {
  onThumbnailDataChange,
  onThumbnailOrderChange,
  previewThumbnailKey,
  refreshPreview,
  thumbnails,
  thumbnailsData,
} from '@core/app/components/FileThumbnail/utils';
import useForceUpdate from '@core/helpers/use-force-update';

import styles from './ThumbnailCarousel.module.scss';

const ThumbnailCarousel = () => {
  const forceUpdate = useForceUpdate();

  const visibleThumbnails = thumbnails.filter((key) => thumbnailsData[key].isVisible);

  useEffect(() => {
    refreshPreview();
  }, []);
  useEffect(() => onThumbnailOrderChange(forceUpdate), [forceUpdate]);
  useEffect(() => onThumbnailDataChange(previewThumbnailKey, forceUpdate), [forceUpdate]);

  return (
    <div>
      <Carousel arrows rootClassName={styles.carousel}>
        {visibleThumbnails.map((key) => (
          <Thumbnail key={key} thumbnailKey={key} />
        ))}
      </Carousel>
    </div>
  );
};

export default ThumbnailCarousel;
